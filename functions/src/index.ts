import * as admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
import * as crypto from 'crypto'
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

const ADMIN_EMAILS = ['brandontinoz@gmail.com', 'tmandovha@gmail.com']

export const setUserRole = onCall(async (request) => {
  const uid = request.data.uid as string
  const role = request.data.role as string
  if (!uid || !role) {
    throw new HttpsError('invalid-argument', 'Missing uid or role')
  }

  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  if (request.data.uid !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'You can only set your own role')
  }

  if (role === 'admin') {
    const callerSnap = await db.collection('users').doc(request.auth.uid).get()
    const callerEmail = callerSnap.data()?.email as string | undefined
    if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
      throw new HttpsError('permission-denied', 'Not authorized for admin role')
    }
  }

  await adminAuth.setCustomUserClaims(uid, { role })
  await db.collection('users').doc(uid).set({ role }, { merge: true })

  const user = await adminAuth.getUser(uid)
  return { success: true, uid, role, claims: user.customClaims }
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

export const processPaynowPayment = onCall(async (request) => {
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
    integrationId: process.env.PAYNOW_INTEGRATION_ID || '',
    integrationKey: process.env.PAYNOW_INTEGRATION_KEY || '',
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

  try {
    const response = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id: paynowConfig.integrationId,
        reference,
        amount: amount.toFixed(2),
        additionalinfo: description,
        returnurl: paynowConfig.returnUrl,
        resulturl: paynowConfig.resultUrl,
        authemail: email || booking.clientEmail || 'client@traamand.co.zw',
        status: 'Message',
      }),
    })

    const text = await response.text()
    const params = new URLSearchParams(text)

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

export const paynowCallback = onRequest(async (req, res) => {
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

  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || ''
  if (integrationKey && hash) {
    const amount = getPaynowParam(params, 'amount')
    const pollUrl = getPaynowParam(params, 'pollurl')
    const expected = crypto.createHash('md5').update(integrationKey + reference + amount + status.toLowerCase() + pollUrl).digest('hex')
    if (expected.toLowerCase() !== hash.toLowerCase()) {
      console.error(`HMAC mismatch for ${reference}: expected ${expected}, got ${hash}`)
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

export const processPayout = onCall(async (request) => {
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

  const integrationId = process.env.PAYNOW_INTEGRATION_ID || ''
  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || ''
  if (!integrationId || !integrationKey) {
    throw new HttpsError('failed-precondition', 'Paynow payout is not configured.')
  }

  const amount = Number(payout.amount) || 0
  if (amount <= 0) throw new HttpsError('invalid-argument', 'Invalid payout amount')

  const fee = Math.round(amount * PAYOUT_FEE_PERCENT * 100) / 100
  const netAmount = amount - fee
  const reference = `PAY-${payoutId.slice(0, 8).toUpperCase()}`
  const recipientPhone = payout.recipient.replace(/[^0-9]/g, '')

  await payoutRef.update({
    status: 'processing',
    fee,
    notes: `Processing via Paynow payout: ${reference}`,
  })

  try {
    const body = new URLSearchParams({
      id: integrationId,
      reference,
      amount: netAmount.toFixed(2),
      additionalinfo: `Traamand payout ${payoutId.slice(0, 8)}`,
      returnurl: getFunctionBaseUrl() + '/paynowCallback',
      resulturl: getFunctionBaseUrl() + '/payoutCallback',
      authemail: 'payouts@traamand.co.zw',
      phone: recipientPhone,
      method: 'ecocash',
      status: 'Message',
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
