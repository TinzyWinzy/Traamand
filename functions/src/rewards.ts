import * as admin from 'firebase-admin'
import { getCommission, getCashbackAmount } from './commission'

function db(): admin.firestore.Firestore {
  return admin.firestore()
}

function timestamp() {
  return admin.firestore.FieldValue.serverTimestamp()
}

interface CreditRewardParams {
  userId: string
  type: string
  event: string
  reference: string
  description: string
  amountOverride?: number
}

async function creditUser({
  userId,
  type,
  event,
  reference,
  description,
  amountOverride,
}: CreditRewardParams): Promise<void> {
  const userRef = db().collection('users').doc(userId)
  const { amount: configuredAmount } = getCommission(event)
  const amount = amountOverride ?? configuredAmount
  if (amount <= 0) return

  const rewardId = `${userId}_${type}_${reference}`.replace(/[^A-Za-z0-9_-]/g, '_')
  const txnRef = db().collection('transactions').doc(rewardId)

  await db().runTransaction(async (tx) => {
    const [userSnap, existingTxn] = await Promise.all([tx.get(userRef), tx.get(txnRef)])
    if (!userSnap.exists || existingTxn.exists) return

    const userData = userSnap.data()!
    const currentBalance = userData.earningsBalance || 0
    const newBalance = currentBalance + amount

    tx.set(txnRef, {
      userId,
      type,
      amount,
      balance: newBalance,
      reference,
      description,
      status: 'completed',
      createdAt: timestamp(),
    })

    tx.update(userRef, {
      earningsBalance: newBalance,
      updatedAt: timestamp(),
    })
  })
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
    type: 'referral_bonus',
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

  await creditUser({
    userId,
    type: 'cashback',
    event: 'cashback_refund',
    reference,
    description: `Cashback milestone: ${totalReferrals} referral${totalReferrals > 1 ? 's' : ''}`,
    amountOverride: amount,
  })
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

  const normalizedCode = referredBy.trim().toUpperCase()

  const [referrerSnap, signupsSnap] = await Promise.all([
    db().collection('users').where('referralCode', '==', normalizedCode).limit(1).get(),
    db().collection('users').where('referredBy', '==', normalizedCode).get(),
  ])
  if (referrerSnap.empty) return result

  const referrer = referrerSnap.docs[0]
  result.referrerId = referrer.id
  result.referrerTotalSignups = signupsSnap.size

  const referrerData = referrer.data()
  if (referrerData.referredBy) {
    const gpCode = String(referrerData.referredBy).trim().toUpperCase()
    const gpSnap = await db().collection('users').where('referralCode', '==', gpCode).limit(1).get()
    if (!gpSnap.empty) {
      result.grandparentId = gpSnap.docs[0].id
    }
  }

  return result
}
