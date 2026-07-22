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
exports.PAYOUT_FEE_PERCENT = exports.TRAAMAND_REVENUE_PERCENT = exports.PLATFORM_FEE_PERCENT = exports.ACTIVE_BOOKING_STATUSES = void 0;
exports.urlEncode = urlEncode;
exports.createPaynowHash = createPaynowHash;
exports.buildPaynowData = buildPaynowData;
exports.verifyPaynowHash = verifyPaynowHash;
exports.getFunctionBaseUrl = getFunctionBaseUrl;
exports.getSiteUrl = getSiteUrl;
exports.getPaynowParam = getPaynowParam;
exports.bookingDocUpdate = bookingDocUpdate;
exports.writePlacementFeeTransaction = writePlacementFeeTransaction;
exports.releaseWorkerIfNoActiveBookings = releaseWorkerIfNoActiveBookings;
exports.changedFields = changedFields;
exports.writeAuditLog = writeAuditLog;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const db = () => admin.firestore();
exports.ACTIVE_BOOKING_STATUSES = ['inquiry', 'matched', 'booked', 'placement_fee_paid', 'worker_assigned', 'started'];
exports.PLATFORM_FEE_PERCENT = 0.15;
exports.TRAAMAND_REVENUE_PERCENT = 0.85;
exports.PAYOUT_FEE_PERCENT = 0.02;
function urlEncode(str) {
    return encodeURI(str);
}
function createPaynowHash(values, integrationKey) {
    let raw = '';
    for (const key of Object.keys(values)) {
        if (key !== 'hash') {
            raw += values[key];
        }
    }
    raw += integrationKey.toLowerCase();
    return crypto.createHash('sha512').update(raw).digest('hex').toUpperCase();
}
function buildPaynowData(params, extraOrder = []) {
    const data = {};
    const order = ['resulturl', 'returnurl', 'reference', 'amount', 'id', 'additionalinfo', 'authemail', ...extraOrder, 'status'];
    for (const key of order) {
        if (key in params) {
            data[key] = urlEncode(params[key]);
        }
    }
    data.hash = createPaynowHash(data, params.integrationKey);
    return data;
}
function verifyPaynowHash(params, integrationKey) {
    const entries = [];
    for (const [key, value] of params.entries()) {
        if (key.toLowerCase() !== 'hash') {
            entries.push([key, value]);
        }
    }
    const raw = entries.map(([, v]) => v).join('') + integrationKey.toLowerCase();
    const expected = crypto.createHash('sha512').update(raw).digest('hex').toUpperCase();
    const received = (params.get('hash') || '').toUpperCase();
    return expected === received;
}
function getFunctionBaseUrl() {
    return (process.env.FUNCTIONS_URL ||
        'https://us-central1-studio-8895863664-52c12.cloudfunctions.net');
}
function getSiteUrl() {
    return process.env.SITE_URL || 'https://www.traamand.co.zw';
}
function getPaynowParam(params, key) {
    return params.get(key) || params.get(key.toLowerCase()) || params.get(key.toUpperCase()) || '';
}
async function bookingDocUpdate(id, data) {
    await db().collection('bookings').doc(id).update({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
async function writePlacementFeeTransaction(bookingId, booking) {
    const fee = booking.placementFee || 0;
    const platformCut = Math.round(fee * exports.PLATFORM_FEE_PERCENT * 100) / 100;
    const traamandNet = Math.round(fee * exports.TRAAMAND_REVENUE_PERCENT * 100) / 100;
    const platformRef = db().collection('transactions').doc(`platform_fee_${bookingId}`);
    const revenueRef = db().collection('transactions').doc(`traamand_revenue_${bookingId}`);
    const [platformSnap, revenueSnap] = await Promise.all([platformRef.get(), revenueRef.get()]);
    if (platformSnap.exists && revenueSnap.exists)
        return;
    const ts = admin.firestore.FieldValue.serverTimestamp();
    const batch = db().batch();
    if (!platformSnap.exists) {
        batch.set(platformRef, {
            userId: 'radbit_studios',
            type: 'platform_fee',
            amount: platformCut,
            balance: 0,
            reference: bookingId,
            description: `Radbit Studios platform fee (${exports.PLATFORM_FEE_PERCENT * 100}%) for booking ${bookingId.slice(0, 8)}`,
            status: 'completed',
            createdAt: ts,
        });
    }
    if (!revenueSnap.exists) {
        batch.set(revenueRef, {
            userId: booking.clientId,
            type: 'traamand_revenue',
            amount: traamandNet,
            balance: 0,
            reference: bookingId,
            description: `Traamand net revenue (${exports.TRAAMAND_REVENUE_PERCENT * 100}%) for booking ${bookingId.slice(0, 8)}`,
            status: 'completed',
            createdAt: ts,
        });
    }
    await batch.commit();
    await bookingDocUpdate(bookingId, { platformCutAmount: platformCut, traamandNetRevenue: traamandNet });
}
async function releaseWorkerIfNoActiveBookings(workerId) {
    const activeSnap = await db()
        .collection('bookings')
        .where('workerId', '==', workerId)
        .where('status', 'in', exports.ACTIVE_BOOKING_STATUSES)
        .limit(1)
        .get();
    if (activeSnap.empty) {
        await db().collection('workers').doc(workerId).set({
            availability: {
                status: 'available',
                nextAvailable: null,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
}
function changedFields(before, after) {
    const beforeChanges = {};
    const afterChanges = {};
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    keys.forEach((key) => {
        if (key === 'updatedAt')
            return;
        const oldValue = before?.[key];
        const newValue = after?.[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            beforeChanges[key] = oldValue ?? null;
            afterChanges[key] = newValue ?? null;
        }
    });
    return { beforeChanges, afterChanges };
}
async function writeAuditLog(entityType, entityId, before, after) {
    const { beforeChanges, afterChanges } = changedFields(before, after);
    if (Object.keys(afterChanges).length === 0)
        return;
    await db().collection('auditLogs').add({
        entityType,
        entityId,
        action: `${entityType}_updated`,
        before: beforeChanges,
        after: afterChanges,
        actorId: after.updatedBy || after.reviewedBy || 'system',
        actorName: after.updatedByName || after.reviewedBy || 'System',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}
