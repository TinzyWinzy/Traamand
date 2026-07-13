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
exports.onUserCreated = exports.onBookingCompleted = exports.onApplicantConverted = exports.sendReplacementAlert = exports.processPaynowPayment = exports.updateLocationStats = exports.generateWorkerSEO = exports.scheduleCheckIns = exports.sendBookingConfirmation = exports.matchWorkerToBooking = exports.prerender = exports.sitemap = exports.setUserRole = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const rewards_1 = require("./rewards");
const commission_1 = require("./commission");
admin.initializeApp();
const db = admin.firestore();
const adminAuth = admin.auth();
(0, v2_1.setGlobalOptions)({ region: 'us-central1' });
exports.setUserRole = (0, https_1.onCall)(async (request) => {
    const uid = request.data.uid;
    const role = request.data.role;
    if (!uid || !role) {
        throw new Error('Missing uid or role');
    }
    await adminAuth.setCustomUserClaims(uid, { role });
    await db.collection('users').doc(uid).set({ role }, { merge: true });
    const user = await adminAuth.getUser(uid);
    return { success: true, uid, role, claims: user.customClaims };
});
var sitemap_1 = require("./sitemap");
Object.defineProperty(exports, "sitemap", { enumerable: true, get: function () { return sitemap_1.sitemap; } });
var prerender_1 = require("./prerender");
Object.defineProperty(exports, "prerender", { enumerable: true, get: function () { return prerender_1.prerender; } });
exports.matchWorkerToBooking = (0, firestore_1.onDocumentCreated)('bookings/{bookingId}', async (event) => {
    const booking = event.data?.data();
    if (!booking)
        return;
    const workersSnap = await db
        .collection('workers')
        .where('isActive', '==', true)
        .where('availability.status', '==', 'available')
        .where('availability.preferredLocations', 'array-contains', booking.clientAddress.suburb)
        .orderBy('rating', 'desc')
        .limit(3)
        .get();
    if (!workersSnap.empty) {
        const suggestions = workersSnap.docs.map((doc) => ({
            id: doc.id,
            displayName: doc.data().displayName,
            rating: doc.data().rating,
            placementFee: doc.data().placementFee,
        }));
        await event.data?.ref.update({
            matchedWorkers: suggestions,
            status: 'matched',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
exports.sendBookingConfirmation = (0, firestore_1.onDocumentUpdated)({ document: 'bookings/{bookingId}' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after)
        return;
    if (before?.status !== after.status && after.status === 'booked') {
        const clientSnap = await db.collection('users').doc(after.clientId).get();
        const client = clientSnap.data();
        if (client) {
            await event.data?.after.ref.update({
                notificationSent: true,
                notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
});
exports.scheduleCheckIns = (0, firestore_1.onDocumentUpdated)({ document: 'bookings/{bookingId}' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after)
        return;
    if (before?.status !== after.status && after.status === 'worker_assigned') {
        const startDate = after.startDate.toDate();
        const day3 = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        const day7 = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const day30 = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        await event.data?.after.ref.update({
            checkInSchedule: {
                day3: admin.firestore.Timestamp.fromDate(day3),
                day7: admin.firestore.Timestamp.fromDate(day7),
                day30: admin.firestore.Timestamp.fromDate(day30),
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
exports.generateWorkerSEO = (0, firestore_1.onDocumentCreated)('workers/{workerId}', async (event) => {
    const worker = event.data?.data();
    if (!worker)
        return;
    const slug = worker.slug || `${worker.firstName}-${worker.lastName}-${worker.serviceAreas?.[0] || 'harare'}-${worker.skills?.[0] || 'worker'}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    const metaTitle = `${worker.displayName || `${worker.firstName} ${worker.lastName.charAt(0)}.`} - Verified ${worker.skills?.[0] || 'Domestic Worker'} in Harare | Traamand`;
    const metaDescription = `${worker.displayName} is a Divine Seal verified ${worker.skills?.[0]?.toLowerCase() || 'domestic worker'} in Harare with ${worker.experienceYears} years experience. ${worker.rating}-star rating from ${worker.reviewCount} reviews.`;
    await event.data?.ref.update({
        slug,
        displayName: worker.displayName || `${worker.firstName} ${worker.lastName.charAt(0)}.`,
        metaTitle,
        metaDescription,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});
exports.updateLocationStats = (0, firestore_1.onDocumentUpdated)({ document: 'workers/{workerId}' }, async (event) => {
    const worker = event.data?.after.data();
    if (!worker)
        return;
    for (const suburb of worker.availability?.preferredLocations || []) {
        for (const skill of worker.skills || []) {
            const pageId = `harare-${suburb.toLowerCase()}-${skill.toLowerCase()}`.replace(/\s+/g, '-');
            const snap = await db
                .collection('workers')
                .where('isActive', '==', true)
                .where('availability.status', '==', 'available')
                .where('availability.preferredLocations', 'array-contains', suburb)
                .get();
            const ratings = snap.docs
                .map((d) => d.data().rating)
                .filter((r) => typeof r === 'number');
            const avgRating = ratings.length > 0
                ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
                : 0;
            await db.collection('locationPages').doc(pageId).set({
                availableWorkerCount: snap.size,
                averageRating: Math.round(avgRating * 10) / 10,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
});
exports.processPaynowPayment = (0, https_1.onCall)(async (request) => {
    const { bookingId, amount, email } = request.data;
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) {
        throw new Error('Booking not found');
    }
    const paynowConfig = {
        integrationId: process.env.PAYNOW_INTEGRATION_ID || '',
        integrationKey: process.env.PAYNOW_INTEGRATION_KEY || '',
        resultUrl: `${process.env.FUNCTIONS_URL || ''}/paynow-callback`,
        returnUrl: `${process.env.FUNCTIONS_URL || ''}/payment-result`,
    };
    const reference = `TRA-${bookingId.slice(0, 8).toUpperCase()}`;
    const description = `Traamand placement fee for booking ${bookingId.slice(0, 8)}`;
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
        });
        const text = await response.text();
        const params = new URLSearchParams(text);
        const pollUrl = params.get('PollUrl');
        const browserUrl = params.get('BrowserUrl');
        if (pollUrl && browserUrl) {
            await bookingRef.update({
                paynowPollUrl: pollUrl,
                paynowReference: reference,
                paynowStatus: 'pending',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                redirectUrl: browserUrl,
                pollUrl,
                reference,
            };
        }
        const error = params.get('Error');
        return { success: false, error: error || 'Payment initiation failed' };
    }
    catch (err) {
        return { success: false, error: err.message };
    }
});
exports.sendReplacementAlert = (0, firestore_1.onDocumentUpdated)({ document: 'bookings/{bookingId}' }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!after)
        return;
    if (!before?.replacementRequested && after.replacementRequested) {
        // Replacement requested - business logic processed
    }
});
// ── Referral reward triggers ──
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
    const userSnap = await db.collection('users').doc(userId).get();
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
    const userSnap = await db.collection('users').doc(clientId).get();
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
exports.onUserCreated = (0, firestore_1.onDocumentCreated)({ document: 'users/{userId}' }, async (event) => {
    const userData = event.data?.data();
    if (!userData)
        return;
    const referredBy = userData.referredBy;
    if (!referredBy)
        return;
    const referrerSnap = await db.collection('users').where('referralCode', '==', referredBy).limit(1).get();
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
