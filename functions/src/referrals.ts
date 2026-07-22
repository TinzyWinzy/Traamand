import * as admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import {
  creditReferralBonus, creditGrandparentBonus,
  creditPlacementBonus, creditCashback,
  resolveReferralChain,
} from './rewards'
import { isReferralMilestoneReached } from './commission'

const db = () => admin.firestore()

export const onUserCreated = onDocumentCreated(
  { document: 'users/{userId}' },
  async (event) => {
    const userData = event.data?.data()
    if (!userData) return

    const referredBy = userData.referredBy as string | undefined
    if (!referredBy) return

    const referrerSnap = await db().collection('users').where('referralCode', '==', referredBy).limit(1).get()
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

export const onApplicantConverted = onDocumentUpdated(
  { document: 'applicants/{applicantId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return

    if (before.status === 'converted' || after.status !== 'converted') return

    const userId = after.userId as string | undefined
    if (!userId) return

    const userSnap = await db().collection('users').doc(userId).get()
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

    const userSnap = await db().collection('users').doc(clientId).get()
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
