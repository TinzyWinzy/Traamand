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
exports.initializeAdminUsers = exports.verifyAdminAccess = exports.setUserRole = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const rateLimit_1 = require("./rateLimit");
const db = () => admin.firestore();
const adminAuth = admin.auth();
exports.setUserRole = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in');
    }
    const callerSnap = await db().collection('users').doc(request.auth.uid).get();
    const callerRole = callerSnap.data()?.role;
    if (!callerRole || !['admin', 'superadmin'].includes(callerRole)) {
        throw new https_1.HttpsError('permission-denied', 'Only admins can set user roles');
    }
    const targetUid = request.data.uid;
    const role = request.data.role;
    if (!targetUid || !role) {
        throw new https_1.HttpsError('invalid-argument', 'Missing uid or role');
    }
    if (!['client', 'verifier', 'admin', 'superadmin'].includes(role)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid role');
    }
    const targetSnap = await db().collection('users').doc(targetUid).get();
    const targetRole = targetSnap.data()?.role;
    if (targetRole === 'superadmin' && callerRole !== 'superadmin') {
        throw new https_1.HttpsError('permission-denied', 'Only superadmin can modify superadmin roles');
    }
    if (role === 'superadmin' && callerRole !== 'superadmin') {
        throw new https_1.HttpsError('permission-denied', 'Only superadmin can assign superadmin role');
    }
    await adminAuth.setCustomUserClaims(targetUid, { role });
    await db().collection('users').doc(targetUid).set({ role }, { merge: true });
    const user = await adminAuth.getUser(targetUid);
    return { success: true, uid: targetUid, role, claims: user.customClaims };
});
exports.verifyAdminAccess = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in');
    }
    if (!(0, rateLimit_1.checkRateLimit)(`admin_verify_${request.auth.uid}`, 20, 900_000)) {
        throw new https_1.HttpsError('resource-exhausted', 'Too many admin verification attempts. Try again in 15 minutes.');
    }
    const userSnap = await db().collection('users').doc(request.auth.uid).get();
    if (!userSnap.exists) {
        throw new https_1.HttpsError('not-found', 'User not found');
    }
    const userData = userSnap.data();
    const role = userData.role;
    if (!role || !['admin', 'superadmin'].includes(role)) {
        throw new https_1.HttpsError('permission-denied', 'Admin access required');
    }
    return {
        authorized: true,
        uid: request.auth.uid,
        role,
        email: userData.email,
        name: userData.name,
    };
});
exports.initializeAdminUsers = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be signed in');
    }
    const callerSnap = await db().collection('users').doc(request.auth.uid).get();
    const callerRole = callerSnap.data()?.role;
    if (callerRole !== 'superadmin') {
        throw new https_1.HttpsError('permission-denied', 'Only superadmin can initialize admin users');
    }
    const adminUsers = [
        { email: 'brandontinoz@gmail.com', role: 'superadmin' },
        { email: 'tmandovha@gmail.com', role: 'admin' },
    ];
    const results = [];
    for (const adminUser of adminUsers) {
        const usersSnap = await db().collection('users').where('email', '==', adminUser.email).limit(1).get();
        if (!usersSnap.empty) {
            const userDoc = usersSnap.docs[0];
            await userDoc.ref.set({ role: adminUser.role }, { merge: true });
            await adminAuth.setCustomUserClaims(userDoc.id, { role: adminUser.role });
            results.push({ email: adminUser.email, role: adminUser.role, status: 'updated' });
        }
        else {
            const fbUser = await adminAuth.getUserByEmail(adminUser.email).catch(() => null);
            if (fbUser) {
                const ts = admin.firestore.FieldValue.serverTimestamp();
                await db().collection('users').doc(fbUser.uid).set({
                    uid: fbUser.uid,
                    name: fbUser.displayName || adminUser.email.split('@')[0],
                    email: adminUser.email,
                    role: adminUser.role,
                    createdAt: ts,
                    updatedAt: ts,
                });
                await adminAuth.setCustomUserClaims(fbUser.uid, { role: adminUser.role });
                results.push({ email: adminUser.email, role: adminUser.role, status: 'created' });
            }
            else {
                results.push({ email: adminUser.email, role: adminUser.role, status: 'not_found' });
            }
        }
    }
    return { success: true, results };
});
