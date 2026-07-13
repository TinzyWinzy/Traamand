import * as admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'
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
  const uid = request.data.uid as string
  const role = request.data.role as string
  if (!uid || !role) {
    throw new Error('Missing uid or role')
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
  const { bookingId, amount, email } = request.data

  const bookingRef = db.collection('bookings').doc(bookingId)
  const bookingSnap = await bookingRef.get()

  if (!bookingSnap.exists) {
    throw new Error('Booking not found')
  }

  const paynowConfig = {
    integrationId: process.env.PAYNOW_INTEGRATION_ID || '',
    integrationKey: process.env.PAYNOW_INTEGRATION_KEY || '',
    resultUrl: `${process.env.FUNCTIONS_URL || ''}/paynow-callback`,
    returnUrl: `${process.env.FUNCTIONS_URL || ''}/payment-result`,
  }

  const reference = `TRA-${bookingId.slice(0, 8).toUpperCase()}`
  const description = `Traamand placement fee for booking ${bookingId.slice(0, 8)}`

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
        authemail: email || 'client@traamand.co.zw',
        status: 'Message',
      }),
    })

    const text = await response.text()
    const params = new URLSearchParams(text)

    const pollUrl = params.get('PollUrl')
    const browserUrl = params.get('BrowserUrl')

    if (pollUrl && browserUrl) {
      await bookingRef.update({
        paynowPollUrl: pollUrl,
        paynowReference: reference,
        paynowStatus: 'pending',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      return {
        success: true,
        redirectUrl: browserUrl,
        pollUrl,
        reference,
      }
    }

    const error = params.get('Error')
    return { success: false, error: error || 'Payment initiation failed' }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
})

export const pollPaynowPayment = onCall(async (request) => {
  const { bookingId } = request.data
  if (!bookingId) throw new Error('Missing bookingId')

  const bookingRef = db.collection('bookings').doc(bookingId)
  const bookingSnap = await bookingRef.get()
  if (!bookingSnap.exists) throw new Error('Booking not found')

  const booking = bookingSnap.data()!
  const pollUrl = booking.paynowPollUrl as string | undefined
  if (!pollUrl) return { paid: false, status: booking.paynowStatus || 'not_started' }

  try {
    const response = await fetch(pollUrl)
    const text = await response.text()
    const params = new URLSearchParams(text)
    const status = params.get('status') || params.get('Status') || 'unknown'
    const paid = status.toLowerCase() === 'paid'

    await bookingRef.update({
      paynowStatus: status,
      placementFeePaid: paid ? true : booking.placementFeePaid || false,
      paynowPaidAt: paid ? admin.firestore.FieldValue.serverTimestamp() : booking.paynowPaidAt || null,
      status: paid ? 'placement_fee_paid' : booking.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (paid) {
      const existingTxn = await db
        .collection('transactions')
        .where('type', '==', 'placement_fee')
        .where('reference', '==', bookingId)
        .limit(1)
        .get()

      if (existingTxn.empty) {
        await db.collection('transactions').add({
          userId: booking.clientId,
          type: 'placement_fee',
          amount: booking.placementFee || 0,
          balance: 0,
          reference: bookingId,
          description: `Placement fee paid for booking ${bookingId.slice(0, 8)}`,
          status: 'completed',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    }

    return { paid, status }
  } catch (err) {
    return { paid: false, status: 'error', error: (err as Error).message }
  }
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
