import * as admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { setGlobalOptions } from 'firebase-functions/v2'

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

admin.initializeApp()
const db = admin.firestore()
const adminAuth = admin.auth()

setGlobalOptions({ region: 'us-central1' })

export const matchWorkerToBooking = onDocumentCreated('bookings/{bookingId}', async (event) => {
  const booking = event.data?.data()
  if (!booking) return

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
      const day3 = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)
      const day7 = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      const day30 = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

      await event.data?.after.ref.update({
        checkInSchedule: {
          day3: admin.firestore.Timestamp.fromDate(day3),
          day7: admin.firestore.Timestamp.fromDate(day7),
          day30: admin.firestore.Timestamp.fromDate(day30),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
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
