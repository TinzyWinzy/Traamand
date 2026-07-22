import * as admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { writeAuditLog, releaseWorkerIfNoActiveBookings } from './helpers'

const db = () => admin.firestore()

export const matchWorkerToBooking = onDocumentCreated('bookings/{bookingId}', async (event) => {
  const booking = event.data?.data()
  if (!booking) return

  let selectedWorkerAvailable = true
  if (booking.workerId) {
    const workerRef = db().collection('workers').doc(booking.workerId)
    await db().runTransaction(async (tx) => {
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

  const workersSnap = await db()
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
      const clientSnap = await db().collection('users').doc(after.clientId).get()
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

      const batch = db().batch()
      ;[
        { type: 'arrival', dueAt: day1, label: 'Arrival check-in' },
        { type: 'day3', dueAt: day3, label: 'Day 3 satisfaction check' },
        { type: 'day7', dueAt: day7, label: 'Day 7 first week review' },
        { type: 'day30', dueAt: day30, label: 'Day 30 guarantee review' },
      ].forEach((task) => {
        const taskRef = db().collection('bookingCheckIns').doc(`${event.params.bookingId}-${task.type}`)
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

export const sendReplacementAlert = onDocumentUpdated(
  { document: 'bookings/{bookingId}' },
  async (_event) => {
    // Replacement requested — business logic placeholder
  }
)
