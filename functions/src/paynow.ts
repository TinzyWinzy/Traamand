import * as admin from 'firebase-admin'
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import {
  buildPaynowData, verifyPaynowHash,
  getFunctionBaseUrl, getSiteUrl, getPaynowParam,
  writePlacementFeeTransaction,
  PLATFORM_FEE_PERCENT, PAYOUT_FEE_PERCENT,
} from './helpers'

const paynowId = defineSecret('PAYNOW_INTEGRATION_ID')
const paynowKey = defineSecret('PAYNOW_INTEGRATION_KEY')

const db = () => admin.firestore()

export const processPaynowPayment = onCall({ secrets: [paynowId, paynowKey] }, async (request) => {
  const { bookingId, email } = request.data
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to pay for this booking.')
  if (!bookingId) throw new HttpsError('invalid-argument', 'Missing bookingId')

  const bookingRef = db().collection('bookings').doc(bookingId)
  const bookingSnap = await bookingRef.get()

  if (!bookingSnap.exists) {
    throw new HttpsError('not-found', 'Booking not found')
  }

  const booking = bookingSnap.data()!
  const userSnap = await db().collection('users').doc(request.auth.uid).get()
  const isAdmin = userSnap.data()?.role === 'admin'
  if (booking.clientId !== request.auth.uid && !isAdmin) {
    throw new HttpsError('permission-denied', 'You can only pay for your own booking.')
  }
  if (booking.placementFeePaid) {
    return {
      success: true,
      alreadyPaid: true,
      reference: booking.paynowReference || `TRA-${bookingId.slice(0, 8).toUpperCase()}`,
    }
  }

  const paynowConfig = {
    integrationId: paynowId.value().trim(),
    integrationKey: paynowKey.value().trim(),
    resultUrl: `${getFunctionBaseUrl()}/paynowCallback`,
    returnUrl: `${getSiteUrl()}/book/${booking.workerSlug || booking.workerId}/confirmation?bookingId=${bookingId}`,
  }

  if (!paynowConfig.integrationId || !paynowConfig.integrationKey) {
    await bookingRef.update({
      paynowStatus: 'configuration_required',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: false, error: 'Paynow is not configured yet. Please contact Traamand on WhatsApp.' }
  }

  const reference = `TRA-${bookingId.slice(0, 8).toUpperCase()}`
  const description = `Traamand placement fee for booking ${bookingId.slice(0, 8)}`
  const amount = Number(booking.placementFee || 0)
  if (!amount || amount <= 0) {
    throw new HttpsError('failed-precondition', 'This booking has no placement fee to pay.')
  }

  const authemail = email || booking.clientEmail || 'client@traamand.co.zw'
  const paynowData = buildPaynowData({
    resulturl: paynowConfig.resultUrl,
    returnurl: paynowConfig.returnUrl,
    reference,
    amount: amount.toFixed(2),
    id: paynowConfig.integrationId,
    additionalinfo: description,
    authemail,
    status: 'Message',
    integrationKey: paynowConfig.integrationKey,
  })
  const hash = paynowData.hash
  const body = new URLSearchParams({
    resulturl: paynowData.resulturl,
    returnurl: paynowData.returnurl,
    reference: paynowData.reference,
    amount: paynowData.amount,
    id: paynowData.id,
    additionalinfo: paynowData.additionalinfo,
    authemail: paynowData.authemail,
    status: paynowData.status,
    hash,
  })

  try {
    const response = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const text = await response.text()
    const params = new URLSearchParams(text)

    const hashOk = verifyPaynowHash(params, paynowConfig.integrationKey)
    if (!hashOk) {
      const raw = text.slice(0, 600)
      await bookingRef.update({
        paynowStatus: 'hash_warning',
        paynowLastError: raw,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    const pollUrl = getPaynowParam(params, 'PollUrl')
    const browserUrl = getPaynowParam(params, 'BrowserUrl')

    if (pollUrl && browserUrl) {
      const fee = Number(booking.placementFee || 0)
      await bookingRef.update({
        paynowPollUrl: pollUrl,
        paynowReference: reference,
        paynowStatus: 'pending',
        platformFeePercent: PLATFORM_FEE_PERCENT,
        platformCutAmount: Math.round(fee * PLATFORM_FEE_PERCENT * 100) / 100,
        traamandNetRevenue: Math.round(fee * (1 - PLATFORM_FEE_PERCENT) * 100) / 100,
        paynowInitiatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      return {
        success: true,
        redirectUrl: browserUrl,
        pollUrl,
        reference,
      }
    }

    const error = getPaynowParam(params, 'Error')
    await bookingRef.update({
      paynowStatus: 'initiation_failed',
      paynowLastError: error || text.slice(0, 300) || 'Payment initiation failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: false, error: error || 'Payment initiation failed' }
  } catch (err) {
    await bookingRef.update({
      paynowStatus: 'initiation_error',
      paynowLastError: (err as Error).message,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: false, error: (err as Error).message }
  }
})

export const pollPaynowPayment = onCall(async (request) => {
  const { bookingId } = request.data
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to check payment status.')
  if (!bookingId) throw new HttpsError('invalid-argument', 'Missing bookingId')

  const bookingRef = db().collection('bookings').doc(bookingId)
  const bookingSnap = await bookingRef.get()
  if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found')

  const booking = bookingSnap.data()!
  const userSnap = await db().collection('users').doc(request.auth.uid).get()
  const isAdmin = userSnap.data()?.role === 'admin'
  if (booking.clientId !== request.auth.uid && !isAdmin) {
    throw new HttpsError('permission-denied', 'You can only check your own booking payment.')
  }

  const pollUrl = booking.paynowPollUrl as string | undefined
  if (!pollUrl) return { paid: false, status: booking.paynowStatus || 'not_started' }

  try {
    const response = await fetch(pollUrl)
    const text = await response.text()
    const params = new URLSearchParams(text)
    const status = getPaynowParam(params, 'status') || 'unknown'
    const paid = status.toLowerCase() === 'paid'

    await bookingRef.update({
      paynowStatus: status,
      placementFeePaid: paid ? true : booking.placementFeePaid || false,
      paynowPaidAt: paid ? admin.firestore.FieldValue.serverTimestamp() : booking.paynowPaidAt || null,
      status: paid ? 'placement_fee_paid' : booking.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (paid) {
      await writePlacementFeeTransaction(bookingId, booking)
    }

    return { paid, status }
  } catch (err) {
    return { paid: false, status: 'error', error: (err as Error).message }
  }
})

export const paynowCallback = onRequest({ secrets: [paynowKey] }, async (req, res) => {
  const rawBody =
    typeof req.body === 'string'
      ? req.body
      : new URLSearchParams((req.body || {}) as Record<string, string>).toString()
  const params = new URLSearchParams(req.method === 'GET' ? (req.url.split('?')[1] || '') : rawBody)
  const reference = getPaynowParam(params, 'reference')
  const status = getPaynowParam(params, 'status') || 'unknown'

  if (!reference.startsWith('TRA-')) {
    res.status(400).send('Invalid reference')
    return
  }

  const integrationKey = paynowKey.value()
  const hash = getPaynowParam(params, 'hash')
  if (integrationKey && hash) {
    if (!verifyPaynowHash(params, integrationKey)) {
      const allParams: Record<string, string> = {}
      params.forEach((v, k) => { allParams[k] = v })
      res.status(403).send('Invalid hash')
      return
    }
  }

  const bookingPrefix = reference.replace(/^TRA-/, '').toLowerCase()
  const snap = await db().collection('bookings').where('paynowReference', '==', reference).limit(1).get()
  const bookingDoc =
    snap.docs[0] ||
    (await db().collection('bookings').get()).docs.find((doc) => doc.id.toLowerCase().startsWith(bookingPrefix))

  if (!bookingDoc) {
    res.status(404).send('Booking not found')
    return
  }

  const booking = bookingDoc.data()
  const paid = status.toLowerCase() === 'paid'
  await bookingDoc.ref.update({
    paynowStatus: status,
    placementFeePaid: paid ? true : booking.placementFeePaid || false,
    paynowPaidAt: paid ? admin.firestore.FieldValue.serverTimestamp() : booking.paynowPaidAt || null,
    status: paid ? 'placement_fee_paid' : booking.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  if (paid) {
    await writePlacementFeeTransaction(bookingDoc.id, booking)
  }

  res.status(200).send('OK')
})

export const payoutCallback = onRequest(async (req, res) => {
  const rawBody =
    typeof req.body === 'string'
      ? req.body
      : new URLSearchParams((req.body || {}) as Record<string, string>).toString()
  const params = new URLSearchParams(req.method === 'GET' ? (req.url.split('?')[1] || '') : rawBody)
  const reference = getPaynowParam(params, 'reference')
  const status = getPaynowParam(params, 'status') || 'unknown'

  if (!reference.startsWith('PAY-')) {
    res.status(400).send('Invalid reference')
    return
  }

  const payoutPrefix = reference.replace(/^PAY-/, '').toLowerCase()
  const snap = await db().collection('payouts').where('notes', '>=', reference).where('notes', '<=', reference + '\uf8ff').limit(1).get()
  const payoutDoc = snap.docs[0] || (await db().collection('payouts').get()).docs.find((doc) => doc.id.toLowerCase().startsWith(payoutPrefix))

  if (!payoutDoc) {
    res.status(404).send('Payout not found')
    return
  }

  const paid = status.toLowerCase() === 'paid'
  if (paid) {
    await payoutDoc.ref.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      notes: `Paynow confirmed: ${reference}`,
    })
  } else {
    await payoutDoc.ref.update({
      status: 'pending',
      notes: `Paynow status: ${status}`,
    })
  }

  res.status(200).send('OK')
})

export const processPayout = onCall({ secrets: [paynowId, paynowKey] }, async (request) => {
  const { payoutId } = request.data
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to process payouts.')
  if (!payoutId) throw new HttpsError('invalid-argument', 'Missing payoutId')

  const userSnap = await db().collection('users').doc(request.auth.uid).get()
  if (userSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can process payouts.')
  }

  const payoutRef = db().collection('payouts').doc(payoutId)
  const payoutSnap = await payoutRef.get()
  if (!payoutSnap.exists) throw new HttpsError('not-found', 'Payout not found')

  const payout = payoutSnap.data()!
  if (payout.status !== 'pending') {
    return { success: false, error: `Payout is already ${payout.status}` }
  }

  const integrationId = paynowId.value()
  const integrationKey = paynowKey.value()
  if (!integrationId || !integrationKey) {
    throw new HttpsError('failed-precondition', 'Paynow payout is not configured.')
  }

  const amount = Number(payout.amount) || 0
  if (amount <= 0) throw new HttpsError('invalid-argument', 'Invalid payout amount')

  const fee = Math.round(amount * PAYOUT_FEE_PERCENT * 100) / 100
  const netAmount = amount - fee
  const reference = `PAY-${payoutId.slice(0, 8).toUpperCase()}`
  const recipientPhone = payout.recipient.replace(/[^0-9]/g, '')

  const additionalInfo = `Traamand payout ${payoutId.slice(0, 8)}`
  const returnUrl = getFunctionBaseUrl() + '/paynowCallback'
  const resultUrl = getFunctionBaseUrl() + '/payoutCallback'
  const payoutEmail = 'payouts@traamand.co.zw'

  const paynowData = buildPaynowData({
    resulturl: resultUrl,
    returnurl: returnUrl,
    reference,
    amount: netAmount.toFixed(2),
    id: integrationId,
    additionalinfo: additionalInfo,
    authemail: payoutEmail,
    phone: recipientPhone,
    method: 'ecocash',
    status: 'Message',
    integrationKey,
  }, ['phone', 'method'])
  const hash = paynowData.hash

  await payoutRef.update({
    status: 'processing',
    fee,
    notes: `Processing via Paynow payout: ${reference}`,
  })

  try {
    const body = new URLSearchParams({
      resulturl: paynowData.resulturl,
      returnurl: paynowData.returnurl,
      reference: paynowData.reference,
      amount: paynowData.amount,
      id: paynowData.id,
      additionalinfo: paynowData.additionalinfo,
      authemail: paynowData.authemail,
      phone: paynowData.phone,
      method: paynowData.method,
      status: paynowData.status,
      hash,
    })

    const response = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    const text = await response.text()
    const result = new URLSearchParams(text)
    const paynowStatus = getPaynowParam(result, 'status')

    if (paynowStatus.toLowerCase() === 'ok') {
      const paynowReference = getPaynowParam(result, 'reference') || reference
      await payoutRef.update({
        status: 'completed',
        notes: `Paid via Paynow ref: ${paynowReference} (fee: $${fee})`,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      return { success: true, reference: paynowReference, netAmount, fee }
    }

    const error = getPaynowParam(result, 'error') || text.slice(0, 300)
    await payoutRef.update({
      status: 'pending',
      notes: `Paynow error: ${error}`,
    })
    return { success: false, error }
  } catch (err) {
    await payoutRef.update({
      status: 'pending',
      notes: `Exception: ${(err as Error).message}`,
    })
    return { success: false, error: (err as Error).message }
  }
})
