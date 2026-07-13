import {
  signInWithPopup,
  GoogleAuthProvider,
  type User as FirebaseUser,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import type { User, UserRole } from '../types'
import { generateReferralCode } from '../lib/referral'
import { getInviteByEmail, markInviteAccepted } from './firestore'

const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
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
  const invite = await getInviteByEmail(firebaseUser.email || data.email || '')

  if (userSnap.exists()) {
    const existing = userSnap.data() as any
    const updates: Record<string, unknown> = {
      name: data.name || existing.name,
      email: data.email || existing.email || firebaseUser.email || '',
      whatsappNumber: whatsappNumber || existing.whatsappNumber || '',
      updatedAt: serverTimestamp(),
    }
    if (invite && invite.role) {
      updates.role = invite.role
    }
    await setDoc(userRef, updates, { merge: true })
    return { ...existing, id: firebaseUser.uid } as User
  }

  const newUser = {
    name: data.name,
    phone: data.phone || '',
    email: data.email || firebaseUser.email || '',
    whatsappNumber,
    addresses: [],
    bookings: [],
    favoriteWorkers: [],
    role: invite ? invite.role : (data.role || 'client'),
    referralCode: generateReferralCode(),
    referredBy,
    earningsBalance: 0,
    referralClicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(userRef, newUser)

  if (invite) {
    await markInviteAccepted(invite.id)
  }

  if (referredBy && typeof window !== 'undefined') {
    sessionStorage.removeItem('traamand_ref')
  }

  return { id: firebaseUser.uid, ...newUser } as unknown as User
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
