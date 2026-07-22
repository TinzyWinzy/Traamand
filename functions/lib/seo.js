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
exports.updateLocationStats = exports.generateWorkerSEO = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const db = () => admin.firestore();
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
            const snap = await db()
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
            await db().collection('locationPages').doc(pageId).set({
                availableWorkerCount: snap.size,
                averageRating: Math.round(avgRating * 10) / 10,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
});
