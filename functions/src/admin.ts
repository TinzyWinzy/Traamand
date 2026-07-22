import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { checkRateLimit } from './rateLimit'

const db = () => admin.firestore()
const adminAuth = admin.auth()

export const setUserRole = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const callerSnap = await db().collection('users').doc(request.auth.uid).get()
  const callerRole = callerSnap.data()?.role as string | undefined

  if (!callerRole || !['admin', 'superadmin'].includes(callerRole)) {
    throw new HttpsError('permission-denied', 'Only admins can set user roles')
  }

  const targetUid = request.data.uid as string
  const role = request.data.role as string
  if (!targetUid || !role) {
    throw new HttpsError('invalid-argument', 'Missing uid or role')
  }

  if (!['client', 'verifier', 'admin', 'superadmin'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Invalid role')
  }

  const targetSnap = await db().collection('users').doc(targetUid).get()
  const targetRole = targetSnap.data()?.role as string | undefined
  if (targetRole === 'superadmin' && callerRole !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only superadmin can modify superadmin roles')
  }
  if (role === 'superadmin' && callerRole !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only superadmin can assign superadmin role')
  }

  await adminAuth.setCustomUserClaims(targetUid, { role })
  await db().collection('users').doc(targetUid).set({ role }, { merge: true })

  const user = await adminAuth.getUser(targetUid)
  return { success: true, uid: targetUid, role, claims: user.customClaims }
})

export const verifyAdminAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  if (!checkRateLimit(`admin_verify_${request.auth.uid}`, 20, 900_000)) {
    throw new HttpsError('resource-exhausted', 'Too many admin verification attempts. Try again in 15 minutes.')
  }

  const userSnap = await db().collection('users').doc(request.auth.uid).get()
  if (!userSnap.exists) {
    throw new HttpsError('not-found', 'User not found')
  }

  const userData = userSnap.data()!
  const role = userData.role as string | undefined

  if (!role || !['admin', 'superadmin'].includes(role)) {
    throw new HttpsError('permission-denied', 'Admin access required')
  }

  return {
    authorized: true,
    uid: request.auth.uid,
    role,
    email: userData.email,
    name: userData.name,
  }
})

export const initializeAdminUsers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in')
  }

  const callerSnap = await db().collection('users').doc(request.auth.uid).get()
  const callerRole = callerSnap.data()?.role as string | undefined
  if (callerRole !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Only superadmin can initialize admin users')
  }

  const adminUsers = [
    { email: 'brandontinoz@gmail.com', role: 'superadmin' as const },
    { email: 'tmandovha@gmail.com', role: 'admin' as const },
  ]

  const results = []
  for (const adminUser of adminUsers) {
    const usersSnap = await db().collection('users').where('email', '==', adminUser.email).limit(1).get()
    if (!usersSnap.empty) {
      const userDoc = usersSnap.docs[0]
      await userDoc.ref.set({ role: adminUser.role }, { merge: true })
      await adminAuth.setCustomUserClaims(userDoc.id, { role: adminUser.role })
      results.push({ email: adminUser.email, role: adminUser.role, status: 'updated' })
    } else {
      const fbUser = await adminAuth.getUserByEmail(adminUser.email).catch(() => null)
      if (fbUser) {
        const ts = admin.firestore.FieldValue.serverTimestamp()
        await db().collection('users').doc(fbUser.uid).set({
          uid: fbUser.uid,
          name: fbUser.displayName || adminUser.email.split('@')[0],
          email: adminUser.email,
          role: adminUser.role,
          createdAt: ts,
          updatedAt: ts,
        })
        await adminAuth.setCustomUserClaims(fbUser.uid, { role: adminUser.role })
        results.push({ email: adminUser.email, role: adminUser.role, status: 'created' })
      } else {
        results.push({ email: adminUser.email, role: adminUser.role, status: 'not_found' })
      }
    }
  }

  return { success: true, results }
})
