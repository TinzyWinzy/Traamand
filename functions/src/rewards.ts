import * as admin from 'firebase-admin'
import { getCommission, isReferralMilestoneReached, getCashbackAmount } from './commission'

const db = admin.firestore()

interface CreditRewardParams {
  userId: string
  type: string
  event: string
  reference: string
  description: string
}

async function creditUser({ userId, type, event, reference, description }: CreditRewardParams): Promise<void> {
  const userRef = db.collection('users').doc(userId)
  const userSnap = await userRef.get()
  if (!userSnap.exists) return

  const userData = userSnap.data()!
  const { amount } = getCommission(event)
  if (amount <= 0) return

  const currentBalance = userData.earningsBalance || 0
  const newBalance = currentBalance + amount

  await db.collection('transactions').add({
    userId,
    type,
    amount,
    balance: newBalance,
    reference,
    description,
    status: 'completed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  await userRef.update({ earningsBalance: newBalance })
}

export async function creditReferralBonus(
  userId: string,
  reference: string,
  description: string
): Promise<void> {
  await creditUser({
    userId,
    type: 'referral_bonus',
    event: 'referral_worker_placed',
    reference,
    description,
  })
}

export async function creditGrandparentBonus(
  userId: string,
  reference: string,
  description: string
): Promise<void> {
  await creditUser({
    userId,
    type: 'referral_grandparent',
    event: 'referral_grandparent',
    reference,
    description,
  })
}

export async function creditPlacementBonus(
  userId: string,
  reference: string,
  description: string
): Promise<void> {
  await creditUser({
    userId,
    type: 'referral_placement',
    event: 'referral_placement',
    reference,
    description,
  })
}

export async function creditCashback(
  userId: string,
  totalReferrals: number,
  reference: string
): Promise<void> {
  const amount = getCashbackAmount(totalReferrals)
  if (amount <= 0) return

  const userRef = db.collection('users').doc(userId)
  const userSnap = await userRef.get()
  if (!userSnap.exists) return

  const userData = userSnap.data()!
  const currentBalance = userData.earningsBalance || 0
  const newBalance = currentBalance + amount

  await db.collection('transactions').add({
    userId,
    type: 'cashback_refund',
    amount,
    balance: newBalance,
    reference,
    description: `Cashback milestone: ${totalReferrals} referral${totalReferrals > 1 ? 's' : ''}`,
    status: 'completed',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  await userRef.update({ earningsBalance: newBalance })
}

export interface ReferralChainResult {
  referrerId: string | null
  grandparentId: string | null
  referrerTotalSignups: number
}

export async function resolveReferralChain(referredBy: string): Promise<ReferralChainResult> {
  const result: ReferralChainResult = {
    referrerId: null,
    grandparentId: null,
    referrerTotalSignups: 0,
  }

  const referrerSnap = await db.collection('users').where('referralCode', '==', referredBy).limit(1).get()
  if (referrerSnap.empty) return result

  const referrer = referrerSnap.docs[0]
  result.referrerId = referrer.id

  const signupsSnap = await db.collection('users').where('referredBy', '==', referredBy).get()
  result.referrerTotalSignups = signupsSnap.size

  const referrerData = referrer.data()
  if (referrerData.referredBy) {
    const gpSnap = await db.collection('users').where('referralCode', '==', referrerData.referredBy).limit(1).get()
    if (!gpSnap.empty) {
      result.grandparentId = gpSnap.docs[0].id
    }
  }

  return result
}
