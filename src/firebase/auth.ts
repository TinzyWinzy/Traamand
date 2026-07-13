import {
  signInWithPopup,
  GoogleAuthProvider,
  type User as FirebaseUser,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from './config'
import type { User, UserRole } from '../types'
import { generateReferralCode } from '../lib/referral'
import { getInviteByEmail, markInviteAccepted } from './firestore'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

async function setCustomClaimRole(uid: string, role: string) {
  try {
    const fn = httpsCallable(functions, 'setUserRole')
    await fn({ uid, role })
  } catch {
    // best-effort: custom claim sync failure should not break sign-in
  }
}

export async function createOrUpdateUser(
  firebaseUser: FirebaseUser,
  data: { name: string; phone?: string; email?: string; role?: UserRole }
): Promise<User> {
  const userRef = doc(db, 'users', firebaseUser.uid)
  const userSnap = await getDoc(userRef)

  const whatsappNumber = data.phone
    ? (data.phone.startsWith('+') ? data.phone : `+263${data.phone.replace(/^0/, '')}`)
    : ''

  const referredBy = typeof window !== 'undefined' ? sessionStorage.getItem('traamand_ref') || '' : ''

  let invite
  try {
    invite = await getInviteByEmail(firebaseUser.email || data.email || '')
  } catch {
    invite = null
  }

  const resolvedRole = invite?.role || data.role || 'client'

  if (userSnap.exists()) {
    const existing = userSnap.data() as any
    const updates: Record<string, unknown> = {
      name: data.name || existing.name,
      email: data.email || existing.email || firebaseUser.email || '',
      whatsappNumber: whatsappNumber || existing.whatsappNumber || '',
      updatedAt: serverTimestamp(),
    }
    if (resolvedRole) {
      updates.role = resolvedRole
    }
    await setDoc(userRef, updates, { merge: true })
    const updatedSnap = await getDoc(userRef)
    const user = { id: firebaseUser.uid, ...updatedSnap.data() } as User
    if (resolvedRole && resolvedRole !== (existing as any).role) {
      setCustomClaimRole(firebaseUser.uid, resolvedRole).catch(() => {})
      try {
        await firebaseUser.getIdToken(true)
      } catch {
        // best-effort: token refresh failure should not break sign-in
      }
    }
    return user
  }

  const newUser = {
    name: data.name,
    phone: data.phone || '',
    email: data.email || firebaseUser.email || '',
    whatsappNumber,
    addresses: [],
    bookings: [],
    favoriteWorkers: [],
    role: resolvedRole,
    referralCode: generateReferralCode(),
    referredBy,
    earningsBalance: 0,
    referralClicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(userRef, newUser)

  if (invite) {
    await markInviteAccepted(invite.id).catch(() => {})
  }

  if (referredBy && typeof window !== 'undefined') {
    sessionStorage.removeItem('traamand_ref')
  }

  const user = { id: firebaseUser.uid, ...newUser } as unknown as User
  setCustomClaimRole(firebaseUser.uid, resolvedRole).catch(() => {})
  try {
    await firebaseUser.getIdToken(true)
  } catch {
    // best-effort: token refresh failure should not break sign-in
  }

  return user
}

export async function getUserData(uid: string): Promise<User | null> {
  const userRef = doc(db, 'users', uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) return null
  return { id: userSnap.id, ...userSnap.data() } as User
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}
