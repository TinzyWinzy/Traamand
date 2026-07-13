"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.creditReferralBonus = creditReferralBonus;
exports.creditGrandparentBonus = creditGrandparentBonus;
exports.creditPlacementBonus = creditPlacementBonus;
exports.creditCashback = creditCashback;
exports.resolveReferralChain = resolveReferralChain;
const admin = __importStar(require("firebase-admin"));
const commission_1 = require("./commission");
function db() {
    return admin.firestore();
}
function timestamp() {
    return admin.firestore.FieldValue.serverTimestamp();
}
async function creditUser({ userId, type, event, reference, description, amountOverride, }) {
    const userRef = db().collection('users').doc(userId);
    const { amount: configuredAmount } = (0, commission_1.getCommission)(event);
    const amount = amountOverride ?? configuredAmount;
    if (amount <= 0)
        return;
    const rewardId = `${userId}_${type}_${reference}`.replace(/[^A-Za-z0-9_-]/g, '_');
    const txnRef = db().collection('transactions').doc(rewardId);
    await db().runTransaction(async (tx) => {
        const [userSnap, existingTxn] = await Promise.all([tx.get(userRef), tx.get(txnRef)]);
        if (!userSnap.exists || existingTxn.exists)
            return;
        const userData = userSnap.data();
        const currentBalance = userData.earningsBalance || 0;
        const newBalance = currentBalance + amount;
        tx.set(txnRef, {
            userId,
            type,
            amount,
            balance: newBalance,
            reference,
            description,
            status: 'completed',
            createdAt: timestamp(),
        });
        tx.update(userRef, {
            earningsBalance: newBalance,
            updatedAt: timestamp(),
        });
    });
}
async function creditReferralBonus(userId, reference, description) {
    await creditUser({
        userId,
        type: 'referral_bonus',
        event: 'referral_worker_placed',
        reference,
        description,
    });
}
async function creditGrandparentBonus(userId, reference, description) {
    await creditUser({
        userId,
        type: 'referral_grandparent',
        event: 'referral_grandparent',
        reference,
        description,
    });
}
async function creditPlacementBonus(userId, reference, description) {
    await creditUser({
        userId,
        type: 'referral_bonus',
        event: 'referral_placement',
        reference,
        description,
    });
}
async function creditCashback(userId, totalReferrals, reference) {
    const amount = (0, commission_1.getCashbackAmount)(totalReferrals);
    if (amount <= 0)
        return;
    await creditUser({
        userId,
        type: 'cashback',
        event: 'cashback_refund',
        reference,
        description: `Cashback milestone: ${totalReferrals} referral${totalReferrals > 1 ? 's' : ''}`,
        amountOverride: amount,
    });
}
async function resolveReferralChain(referredBy) {
    const result = {
        referrerId: null,
        grandparentId: null,
        referrerTotalSignups: 0,
    };
    const normalizedCode = referredBy.trim().toUpperCase();
    const referrerSnap = await db().collection('users').where('referralCode', '==', normalizedCode).limit(1).get();
    if (referrerSnap.empty)
        return result;
    const referrer = referrerSnap.docs[0];
    result.referrerId = referrer.id;
    const signupsSnap = await db().collection('users').where('referredBy', '==', normalizedCode).get();
    result.referrerTotalSignups = signupsSnap.size;
    const referrerData = referrer.data();
    if (referrerData.referredBy) {
        const gpCode = String(referrerData.referredBy).trim().toUpperCase();
        const gpSnap = await db().collection('users').where('referralCode', '==', gpCode).limit(1).get();
        if (!gpSnap.empty) {
            result.grandparentId = gpSnap.docs[0].id;
        }
    }
    return result;
}
