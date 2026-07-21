import * as admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import { defineSecret } from 'firebase-functions/params'
import * as crypto from 'crypto'

type UserRole = 'client' | 'admin' | 'superadmin' | 'verifier' | 'creator' | 'sponsor' | 'advertise' | 'applicant'

const paynowId = defineSecret('PAYNOW_INTEGRATION_ID')
const paynowKey = defineSecret('PAYNOW_INTEGRATION_KEY')
import {
  creditReferralBonus,
  creditGrandparentBonus,
  creditPlacementBonus,
  creditCashback,
  resolveReferralChain,
} from './rewards'
import { isReferralMilestoneReached } from './commission'

admin.initializeApp()
const db = admin.firestore()
const adminAuth = admin.auth()

setGlobalOptions({ region: 'us-central1' })

const ACTIVE_BOOKING_STATUSES = ['inquiry', 'matched', 'booked', 'placement_fee_paid', 'worker_assigned', 'started']

const PLATFORM_FEE_PERCENT = 0.15
const TRAAMAND_REVENUE_PERCENT = 0.85
const PAYOUT_FEE_PERCENT = 0.02

function urlEncode(str: string): string {
  return encodeURI(str)
}

function createPaynowHash(values: Record<string, string>, integrationKey: string): string {
  let raw = ''
  for (const key of Object.keys(values)) {
    if (key !== 'hash') {
      raw += values[key]
    }
  }
  raw += integrationKey.toLowerCase()
  return crypto.createHash('sha512').update(raw).digest('hex').toUpperCase()
}

function buildPaynowData(params: Record<string, string>, extraOrder: string[] = []): Record<string, string> {
  const data: Record<string, string> = {}
  const order = ['resulturl', 'returnurl', 'reference', 'amount', 'id', 'additionalinfo', 'authemail', ...extraOrder, 'status']
  for (const key of order) {
    if (key in params) {
      data[key] = urlEncode(params[key])
    }
  }
  data.hash = createPaynowHash(data, params.integrationKey)
  return data
}

function verifyPaynowHash(params: URLSearchParams, integrationKey: string): boolean {
  const entries: [string, string][] = []
  for (const [key, value] of params.entries()) {
    if (key.toLowerCase() !== 'hash') {
      entries.push([key, value])
    }
  }
  const raw = entries.map(([, v]) => v).join('') + integrationKey.toLowerCase()
  const expected = crypto.createHash('sha512').update(raw).digest('hex').toUpperCase()
  const received = (params.get('hash') || '').toUpperCase()
  return expected === received
}

function getFunctionBaseUrl() {
  return (
    process.env.FUNCTIONS_URL ||
    'https://us-central1-studio-8895863664-52c12.cloudfunctions.net'
  )
}

function getSiteUrl() {
  return process.env.SITE_URL || 'https://www.traamand.co.zw'
}

function getPaynowParam(params: URLSearchParams, key: string) {
  return params.get(key) || params.get(key.toLowerCase()) || params.get(key.toUpperCase()) || ''
}

async function writePlacementFeeTransaction(bookingId: string, booking: FirebaseFirestore.DocumentData) {
  const fee = booking.placementFee || 0
  const platformCut = Math.round(fee * PLATFORM_FEE_PERCENT * 100) / 100
  const traamandNet = Math.round(fee * TRAAMAND_REVENUE_PERCENT * 100) / 100

  const platformRef = db.collection('transactions').doc(`platform_fee_${bookingId}`)
  const revenueRef = db.collection('transactions').doc(`traamand_revenue_${bookingId}`)
  const [platformSnap, revenueSnap] = await Promise.all([platformRef.get(), revenueRef.get()])
  if (platformSnap.exists && revenueSnap.exists) return

  const ts = admin.firestore.FieldValue.serverTimestamp()
  const batch = db.batch()

  if (!platformSnap.exists) {
    batch.set(platformRef, {
      userId: 'radbit_studios',
      type: 'platform_fee',
      amount: platformCut,
      balance: 0,
      reference: bookingId,
      description: `Radbit Studios platform fee (${PLATFORM_FEE_PERCENT * 100}%) for booking ${bookingId.slice(0, 8)}`,
      status: 'completed',
      createdAt: ts,
    })
  }

  if (!revenueSnap.exists) {
    batch.set(revenueRef, {
      userId: booking.clientId,
      type: 'traamand_revenue',
      amount: traamandNet,
      balance: 0,
      reference: bookingId,
      description: `Traamand net revenue (${TRAAMAND_REVENUE_PERCENT * 100}%) for booking ${bookingId.slice(0, 8)}`,
      status: 'completed',
      createdAt: ts,
    })
  }

  await batch.commit()

  await bookingDocUpdate(bookingId, { platformCutAmount: platformCut, traamandNetRevenue: traamandNet })
}

async function bookingDocUpdate(id: string, data: Record<string, unknown>) {
  await db.collection('bookings').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}

function changedFields(before: FirebaseFirestore.DocumentData, after: FirebaseFirestore.DocumentData) {
  const beforeChanges: Record<string, unknown> = {}
  const afterChanges: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])

  keys.forEach((key) => {
    if (key === 'updatedAt') return
    const oldValue = before?.[key]
    const newValue = after?.[key]
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      beforeChanges[key] = oldValue ?? null
      afterChanges[key] = newValue ?? null
    }
  })

  return { beforeChanges, afterChanges }
}

async function writeAuditLog(
  entityType: 'booking' | 'applicant',
  entityId: string,
  before: FirebaseFirestore.DocumentData,
  after: FirebaseFirestore.DocumentData
) {
  const { beforeChanges, afterChanges } = changedFields(before, after)
  if (Object.keys(afterChanges).length === 0) return

  await db.collection('auditLogs').add({
    entityType,
    entityId,
    action: `${entityType}_updated`,
    before: beforeChanges,
    after: afterChanges,
    actorId: after.updatedBy || after.reviewedBy || 'system',
    actorName: after.updatedByName || after.reviewedBy || 'System',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}

async function releaseWorkerIfNoActiveBookings(workerId: string) {
  const activeSnap = await db
    .collection('bookings')
    .where('workerId', '==', workerId)
    .where('status', 'in', ACTIVE_BOOKING_STATUSES)
    .limit(1)
    .get()

  if (activeSnap.empty) {
    await db.collection('workers').doc(workerId).set(
      {
        availability: {
          status: 'available',
          nextAvailable: null,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  }
}

export const setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const callerSnap = await db.collection('users').doc(request.auth.uid).get()
  const callerRole = callerSnap.data()?.role as string | undefined

  if (!callerRole || !['admin', 'superadmin'].includes(callerRole)) {
    throw new HttpsError('permission-denied', 'Only admins can set user roles')
  }

  const targetUid = request.data.uid as string
  const role = request.data.role as string
  if (!targetUid || !role) {
    throw new HttpsError('invalid-argument', 'Missing uid or role')
  }

  if (!['client', 'verifier', 'admin', 'superadmin'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Invalid role')
  }

  const targetSnap = await db.collection('users').doc(targetUid).get()
  const targetRole = targetSnap.data()?.role as string | undefined
  if (targetRole === 'superadmin' && callerRole !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only superadmin can modify superadmin roles')
  }
  if (role === 'superadmin' && callerRole !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only superadmin can assign superadmin role')
  }

  await adminAuth.setCustomUserClaims(targetUid, { role })
  await db.collection('users').doc(targetUid).set({ role }, { merge: true })

  const user = await adminAuth.getUser(targetUid)
  return { success: true, uid: targetUid, role, claims: user.customClaims }
})

export const verifyAdminAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const userSnap = await db.collection('users').doc(request.auth.uid).get()
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User not found')
  }

  const userData = userSnap.data()!
  const role = userData.role as string | undefined

  if (!role || !['admin', 'superadmin'].includes(role)) {
    throw new HttpsError('permission-denied', 'Admin access required')
  }

  return {
    authorized: true,
    uid: request.auth.uid,
    role,
    email: userData.email,
    name: userData.name,
  }
})

export const initializeAdminUsers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const callerSnap = await db.collection('users').doc(request.auth.uid).get()
  const callerRole = callerSnap.data()?.role as string | undefined
  if (callerRole !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only superadmin can initialize admin users')
  }

  const adminUsers = [
    { email: 'brandontinoz@gmail.com', role: 'superadmin' as UserRole },
    { email: 'tmandovha@gmail.com', role: 'admin' as UserRole },
  ]

  const results = []
  for (const adminUser of adminUsers) {
    const usersSnap = await db.collection('users').where('email', '==', adminUser.email).limit(1).get()
    if (!usersSnap.empty) {
      const userDoc = usersSnap.docs[0]
      await userDoc.ref.set({ role: adminUser.role }, { merge: true })
      await adminAuth.setCustomUserClaims(userDoc.id, { role: adminUser.role })
      results.push({ email: adminUser.email, role: adminUser.role, status: 'updated' })
    } else {
      const fbUser = await adminAuth.getUserByEmail(adminUser.email).catch(() => null)
      if (fbUser) {
        const ts = admin.firestore.FieldValue.serverTimestamp()
        await db.collection('users').doc(fbUser.uid).set({
          uid: fbUser.uid,
          name: fbUser.displayName || adminUser.email.split('@')[0],
          email: adminUser.email,
          role: adminUser.role,
          createdAt: ts,
          updatedAt: ts,
        })
        await adminAuth.setCustomUserClaims(fbUser.uid, { role: adminUser.role })
        results.push({ email: adminUser.email, role: adminUser.role, status: 'created' })
      } else {
        results.push({ email: adminUser.email, role: adminUser.role, status: 'not_found' })
      }
    }
  }

  return { success: true, results }
})

export { sitemap } from './sitemap'
export { prerender } from './prerender'

export const matchWorkerToBooking = onDocumentCreated('bookings/{bookingId}', async (event) => {
  const booking = event.data?.data()
  if (!booking) return

  let selectedWorkerAvailable = true
  if (booking.workerId) {
    const workerRef = db.collection('workers').doc(booking.workerId)
    await db.runTransaction(async (tx) => {
      const workerSnap = await tx.get(workerRef)
      const worker = workerSnap.data()
      if (!workerSnap.exists || !worker) return

      if (worker.availability?.status && worker.availability.status !== 'available') {
        selectedWorkerAvailable = false
        tx.update(event.data!.ref, {
          status: 'cancelled',
          replacementRequested: true,
          replacementReason: 'Worker is no longer available. Please choose another worker.',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        return
      }

      tx.set(
        workerRef,
        {
          availability: {
            ...worker.availability,
            status: 'booked',
            nextAvailable: null,
          },
          lastHiredAt: admin.firestore.FieldValue.serverTimestamp(),
          hireCount: (worker.hireCount || 0) + 1,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    })
  }

  if (!selectedWorkerAvailable) return

  const workersSnap = await db
    .collection('workers')
    .where('isActive', '==', true)
    .where('availability.status', '==', 'available')
    .where('availability.preferredLocations', 'array-contains', booking.clientAddress.suburb)
    .orderBy('rating', 'desc')
    .limit(3)
    .get()

  if (!workersSnap.empty) {
    const suggestions = workersSnap.docs.map((doc) => ({
      id: doc.id,
      displayName: doc.data().displayName,
      rating: doc.data().rating,
      placementFee: doc.data().placementFee,
    }))

    await event.data?.ref.update({
      matchedWorkers: suggestions,
      status: 'matched',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }
})

export const sendBookingConfirmation = onDocumentUpdated(
  { document: 'bookings/{bookingId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return

    if (before?.status !== after.status && after.status === 'booked') {
      const clientSnap = await db.collection('users').doc(after.clientId).get()
      const client = clientSnap.data()

      if (client) {
        await event.data?.after.ref.update({
          notificationSent: true,
          notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    }
  }
)

export const scheduleCheckIns = onDocumentUpdated(
  { document: 'bookings/{bookingId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return

    if (before?.status !== after.status && after.status === 'worker_assigned') {
      const startDate = after.startDate.toDate()
      const day1 = new Date(startDate.getTime())
      const day3 = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)
      const day7 = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      const day30 = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

      await event.data?.after.ref.update({
        checkInSchedule: {
          arrival: admin.firestore.Timestamp.fromDate(day1),
          day3: admin.firestore.Timestamp.fromDate(day3),
          day7: admin.firestore.Timestamp.fromDate(day7),
          day30: admin.firestore.Timestamp.fromDate(day30),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      const batch = db.batch()
      ;[
        { type: 'arrival', dueAt: day1, label: 'Arrival check-in' },
        { type: 'day3', dueAt: day3, label: 'Day 3 satisfaction check' },
        { type: 'day7', dueAt: day7, label: 'Day 7 first week review' },
        { type: 'day30', dueAt: day30, label: 'Day 30 guarantee review' },
      ].forEach((task) => {
        const taskRef = db.collection('bookingCheckIns').doc(`${event.params.bookingId}-${task.type}`)
        batch.set(taskRef, {
          bookingId: event.params.bookingId,
          clientId: after.clientId,
          workerId: after.workerId,
          type: task.type,
          label: task.label,
          status: 'open',
          dueAt: admin.firestore.Timestamp.fromDate(task.dueAt),
          completedAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })
      await batch.commit()
    }
  }
)

export const generateWorkerSEO = onDocumentCreated('workers/{workerId}', async (event) => {
  const worker = event.data?.data()
  if (!worker) return

  const slug = worker.slug || `${worker.firstName}-${worker.lastName}-${worker.serviceAreas?.[0] || 'harare'}-${worker.skills?.[0] || 'worker'}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const metaTitle = `${worker.displayName || `${worker.firstName} ${worker.lastName.charAt(0)}.`} - Verified ${worker.skills?.[0] || 'Domestic Worker'} in Harare | Traamand`
  const metaDescription = `${worker.displayName} is a Divine Seal verified ${worker.skills?.[0]?.toLowerCase() || 'domestic worker'} in Harare with ${worker.experienceYears} years experience. ${worker.rating}-star rating from ${worker.reviewCount} reviews.`

  await event.data?.ref.update({
    slug,
    displayName: worker.displayName || `${worker.firstName} ${worker.lastName.charAt(0)}.`,
    metaTitle,
    metaDescription,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
})

export const updateLocationStats = onDocumentUpdated(
  { document: 'workers/{workerId}' },
  async (event) => {
    const worker = event.data?.after.data()
    if (!worker) return

    for (const suburb of worker.availability?.preferredLocations || []) {
      for (const skill of worker.skills || []) {
        const pageId = `harare-${suburb.toLowerCase()}-${skill.toLowerCase()}`.replace(/\s+/g, '-')

        const snap = await db
          .collection('workers')
          .where('isActive', '==', true)
          .where('availability.status', '==', 'available')
          .where('availability.preferredLocations', 'array-contains', suburb)
          .get()

        const ratings = snap.docs
          .map((d) => d.data().rating)
          .filter((r) => typeof r === 'number') as number[]

        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0

        await db.collection('locationPages').doc(pageId).set(
          {
            availableWorkerCount: snap.size,
            averageRating: Math.round(avgRating * 10) / 10,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }
    }
  }
)

export const processPaynowPayment = onCall({ secrets: [paynowId, paynowKey] }, async (request) => {
  const { bookingId, email } = request.data
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to pay for this booking.')
  if (!bookingId) throw new HttpsError('invalid-argument', 'Missing bookingId')

  const bookingRef = db.collection('bookings').doc(bookingId)
  const bookingSnap = await bookingRef.get()

  if (!bookingSnap.exists) {
    throw new HttpsError('not-found', 'Booking not found')
  }

  const booking = bookingSnap.data()!
  const userSnap = await db.collection('users').doc(request.auth.uid).get()
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
  console.error(`PAYNOW_DEBUG id="${paynowConfig.integrationId}" idLen=${paynowConfig.integrationId.length} key="${paynowConfig.integrationKey.slice(0,4)}..." body=${body.toString()}`)

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
      console.error(`Hash mismatch for inbound response. Sent hash=${hash}. Response: ${raw}`)
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
        traamandNetRevenue: Math.round(fee * TRAAMAND_REVENUE_PERCENT * 100) / 100,
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

  const bookingRef = db.collection('bookings').doc(bookingId)
  const bookingSnap = await bookingRef.get()
  if (!bookingSnap.exists) throw new HttpsError('not-found', 'Booking not found')

  const booking = bookingSnap.data()!
  const userSnap = await db.collection('users').doc(request.auth.uid).get()
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
  const hash = getPaynowParam(params, 'hash')

  if (!reference.startsWith('TRA-')) {
    res.status(400).send('Invalid reference')
    return
  }

  const integrationKey = paynowKey.value()
  if (integrationKey && hash) {
    if (!verifyPaynowHash(params, integrationKey)) {
      const allParams: Record<string, string> = {}
      params.forEach((v, k) => { allParams[k] = v })
      console.error(`Hash mismatch for ${reference}: params=${JSON.stringify(allParams)}`)
      res.status(403).send('Invalid hash')
      return
    }
  }

  const bookingPrefix = reference.replace(/^TRA-/, '').toLowerCase()
  const snap = await db.collection('bookings').where('paynowReference', '==', reference).limit(1).get()
  const bookingDoc =
    snap.docs[0] ||
    (await db.collection('bookings').get()).docs.find((doc) => doc.id.toLowerCase().startsWith(bookingPrefix))

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

export const onBookingAuditAndAvailability = onDocumentUpdated(
  { document: 'bookings/{bookingId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    await writeAuditLog('booking', event.params.bookingId, before, after)

    const oldStatus = before.status as string
    const newStatus = after.status as string
    if (oldStatus !== newStatus && ['cancelled', 'completed'].includes(newStatus) && after.workerId) {
      await releaseWorkerIfNoActiveBookings(after.workerId)
    }
  }
)

export const onApplicantAudit = onDocumentUpdated(
  { document: 'applicants/{applicantId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return
    await writeAuditLog('applicant', event.params.applicantId, before, after)
  }
)

export const sendReplacementAlert = onDocumentUpdated(
  { document: 'bookings/{bookingId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!after) return

    if (!before?.replacementRequested && after.replacementRequested) {
      // Replacement requested - business logic processed
    }
  }
)

// ── Referral reward triggers ──

export const onApplicantConverted = onDocumentUpdated(
  { document: 'applicants/{applicantId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    if (before.status === 'converted' || after.status !== 'converted') return

    const userId = after.userId as string | undefined
    if (!userId) return

    const userSnap = await db.collection('users').doc(userId).get()
    if (!userSnap.exists) return
    const userData = userSnap.data()!
    const referredBy = userData.referredBy as string | undefined
    if (!referredBy) return

    const fullName = after.fullName as string
    const position = after.position as string
    const workerId = after.convertedWorkerId as string | undefined
    const reference = workerId || after.applicantId || event.params.applicantId

    const { referrerId, grandparentId, referrerTotalSignups } = await resolveReferralChain(referredBy)

    if (referrerId) {
      await creditReferralBonus(
        referrerId,
        reference,
        `Worker referral bonus: ${fullName} placed as ${position}`
      )

      if (isReferralMilestoneReached(referrerTotalSignups + 1)) {
        await creditCashback(referrerId, referrerTotalSignups + 1, reference)
      }
    }

    if (grandparentId) {
      await creditGrandparentBonus(
        grandparentId,
        reference,
        `Grandparent bonus: ${fullName} placed (referred by ${userData.name || 'referrer'})`
      )
    }
  }
)

export const onBookingCompleted = onDocumentUpdated(
  { document: 'bookings/{bookingId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    const targetStatuses = ['placement_fee_paid', 'booked', 'completed']
    const oldStatus = before.status as string
    const newStatus = after.status as string
    if (oldStatus === newStatus || !targetStatuses.includes(newStatus)) return

    const clientId = after.clientId as string | undefined
    if (!clientId) return

    const userSnap = await db.collection('users').doc(clientId).get()
    if (!userSnap.exists) return
    const userData = userSnap.data()!
    const referredBy = userData.referredBy as string | undefined
    if (!referredBy) return

    const bookingId = event.params.bookingId

    const { referrerId, grandparentId, referrerTotalSignups } = await resolveReferralChain(referredBy)

    if (referrerId) {
      const serviceType = (after.serviceType as string) || 'worker'
      await creditPlacementBonus(
        referrerId,
        bookingId,
        `Referral placement bonus: ${userData.name || 'A friend'} hired a ${serviceType}`
      )

      if (isReferralMilestoneReached(referrerTotalSignups + 1)) {
        await creditCashback(referrerId, referrerTotalSignups + 1, bookingId)
      }
    }

    if (grandparentId) {
      await creditGrandparentBonus(
        grandparentId,
        bookingId,
        `Grandparent bonus: referred client hired a ${(after.serviceType as string) || 'worker'}`
      )
    }
  }
)

export const onUserCreated = onDocumentCreated(
  { document: 'users/{userId}' },
  async (event) => {
    const userData = event.data?.data()
    if (!userData) return

    const referredBy = userData.referredBy as string | undefined
    if (!referredBy) return

    const referrerSnap = await db.collection('users').where('referralCode', '==', referredBy).limit(1).get()
    if (referrerSnap.empty) return

    const referrerRef = referrerSnap.docs[0].ref
    const referrerData = referrerSnap.docs[0].data()
    const currentClicks = referrerData.referralClicks || 0
    const currentSignups = referrerData.referralSignups || 0

    await referrerRef.update({
      referralSignups: currentSignups + 1,
      referralClicks: currentClicks + 1,
    })
  }
)

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
  const snap = await db.collection('payouts').where('notes', '>=', reference).where('notes', '<=', reference + '\uf8ff').limit(1).get()
  const payoutDoc = snap.docs[0] || (await db.collection('payouts').get()).docs.find((doc) => doc.id.toLowerCase().startsWith(payoutPrefix))

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

  const userSnap = await db.collection('users').doc(request.auth.uid).get()
  if (userSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can process payouts.')
  }

  const payoutRef = db.collection('payouts').doc(payoutId)
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
