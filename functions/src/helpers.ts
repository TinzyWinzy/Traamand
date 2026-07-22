import * as admin from 'firebase-admin'
import * as crypto from 'crypto'

const db = () => admin.firestore()

export const ACTIVE_BOOKING_STATUSES = ['inquiry', 'matched', 'booked', 'placement_fee_paid', 'worker_assigned', 'started']

export const PLATFORM_FEE_PERCENT = 0.15
export const TRAAMAND_REVENUE_PERCENT = 0.85
export const PAYOUT_FEE_PERCENT = 0.02

export function urlEncode(str: string): string {
  return encodeURI(str)
}

export function createPaynowHash(values: Record<string, string>, integrationKey: string): string {
  let raw = ''
  for (const key of Object.keys(values)) {
    if (key !== 'hash') {
      raw += values[key]
    }
  }
  raw += integrationKey.toLowerCase()
  return crypto.createHash('sha512').update(raw).digest('hex').toUpperCase()
}

export function buildPaynowData(params: Record<string, string>, extraOrder: string[] = []): Record<string, string> {
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

export function verifyPaynowHash(params: URLSearchParams, integrationKey: string): boolean {
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

export function getFunctionBaseUrl() {
  return (
    process.env.FUNCTIONS_URL ||
    'https://us-central1-studio-8895863664-52c12.cloudfunctions.net'
  )
}

export function getSiteUrl() {
  return process.env.SITE_URL || 'https://www.traamand.co.zw'
}

export function getPaynowParam(params: URLSearchParams, key: string) {
  return params.get(key) || params.get(key.toLowerCase()) || params.get(key.toUpperCase()) || ''
}

export async function bookingDocUpdate(id: string, data: Record<string, unknown>) {
  await db().collection('bookings').doc(id).update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}

export async function writePlacementFeeTransaction(bookingId: string, booking: FirebaseFirestore.DocumentData) {
  const fee = booking.placementFee || 0
  const platformCut = Math.round(fee * PLATFORM_FEE_PERCENT * 100) / 100
  const traamandNet = Math.round(fee * TRAAMAND_REVENUE_PERCENT * 100) / 100

  const platformRef = db().collection('transactions').doc(`platform_fee_${bookingId}`)
  const revenueRef = db().collection('transactions').doc(`traamand_revenue_${bookingId}`)
  const [platformSnap, revenueSnap] = await Promise.all([platformRef.get(), revenueRef.get()])
  if (platformSnap.exists && revenueSnap.exists) return

  const ts = admin.firestore.FieldValue.serverTimestamp()
  const batch = db().batch()

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

export async function releaseWorkerIfNoActiveBookings(workerId: string) {
  const activeSnap = await db()
    .collection('bookings')
    .where('workerId', '==', workerId)
    .where('status', 'in', ACTIVE_BOOKING_STATUSES)
    .limit(1)
    .get()

  if (activeSnap.empty) {
    await db().collection('workers').doc(workerId).set(
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

export function changedFields(before: FirebaseFirestore.DocumentData, after: FirebaseFirestore.DocumentData) {
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

export async function writeAuditLog(
  entityType: 'booking' | 'applicant',
  entityId: string,
  before: FirebaseFirestore.DocumentData,
  after: FirebaseFirestore.DocumentData
) {
  const { beforeChanges, afterChanges } = changedFields(before, after)
  if (Object.keys(afterChanges).length === 0) return

  await db().collection('auditLogs').add({
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
