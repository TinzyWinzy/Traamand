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
exports.onBookingCompleted = exports.onApplicantConverted = exports.onUserCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const rewards_1 = require("./rewards");
const commission_1 = require("./commission");
const db = () => admin.firestore();
exports.onUserCreated = (0, firestore_1.onDocumentCreated)({ document: 'users/{userId}' }, async (event) => {
    const userData = event.data?.data();
    if (!userData)
        return;
    const referredBy = userData.referredBy;
    if (!referredBy)
        return;
    const referrerSnap = await db().collection('users').where('referralCode', '==', referredBy).limit(1).get();
    if (referrerSnap.empty)
        return;
    const referrerRef = referrerSnap.docs[0].ref;
    const referrerData = referrerSnap.docs[0].data();
    const currentClicks = referrerData.referralClicks || 0;
    const currentSignups = referrerData.referralSignups || 0;
    await referrerRef.update({
        referralSignups: currentSignups + 1,
        referralClicks: currentClicks + 1,
    });
});
exports.onApplicantConverted = (0, firestore_1.onDocumentUpdated)({ document: 'applicants/{applicantId}' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    if (before.status === 'converted' || after.status !== 'converted')
        return;
    const userId = after.userId;
    if (!userId)
        return;
    const userSnap = await db().collection('users').doc(userId).get();
    if (!userSnap.exists)
        return;
    const userData = userSnap.data();
    const referredBy = userData.referredBy;
    if (!referredBy)
        return;
    const fullName = after.fullName;
    const position = after.position;
    const workerId = after.convertedWorkerId;
    const reference = workerId || after.applicantId || event.params.applicantId;
    const { referrerId, grandparentId, referrerTotalSignups } = await (0, rewards_1.resolveReferralChain)(referredBy);
    if (referrerId) {
        await (0, rewards_1.creditReferralBonus)(referrerId, reference, `Worker referral bonus: ${fullName} placed as ${position}`);
        if ((0, commission_1.isReferralMilestoneReached)(referrerTotalSignups + 1)) {
            await (0, rewards_1.creditCashback)(referrerId, referrerTotalSignups + 1, reference);
        }
    }
    if (grandparentId) {
        await (0, rewards_1.creditGrandparentBonus)(grandparentId, reference, `Grandparent bonus: ${fullName} placed (referred by ${userData.name || 'referrer'})`);
    }
});
exports.onBookingCompleted = (0, firestore_1.onDocumentUpdated)({ document: 'bookings/{bookingId}' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    const targetStatuses = ['placement_fee_paid', 'booked', 'completed'];
    const oldStatus = before.status;
    const newStatus = after.status;
    if (oldStatus === newStatus || !targetStatuses.includes(newStatus))
        return;
    const clientId = after.clientId;
    if (!clientId)
        return;
    const userSnap = await db().collection('users').doc(clientId).get();
    if (!userSnap.exists)
        return;
    const userData = userSnap.data();
    const referredBy = userData.referredBy;
    if (!referredBy)
        return;
    const bookingId = event.params.bookingId;
    const { referrerId, grandparentId, referrerTotalSignups } = await (0, rewards_1.resolveReferralChain)(referredBy);
    if (referrerId) {
        const serviceType = after.serviceType || 'worker';
        await (0, rewards_1.creditPlacementBonus)(referrerId, bookingId, `Referral placement bonus: ${userData.name || 'A friend'} hired a ${serviceType}`);
        if ((0, commission_1.isReferralMilestoneReached)(referrerTotalSignups + 1)) {
            await (0, rewards_1.creditCashback)(referrerId, referrerTotalSignups + 1, bookingId);
        }
    }
    if (grandparentId) {
        await (0, rewards_1.creditGrandparentBonus)(grandparentId, bookingId, `Grandparent bonus: referred client hired a ${after.serviceType || 'worker'}`);
    }
});
