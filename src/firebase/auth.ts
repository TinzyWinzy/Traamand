import {
  signInWithPhoneNumber,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  type ConfirmationResult,
  type User as FirebaseUser,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import type { User, UserRole } from '../types'
import { generateReferralCode } from '../lib/referral'

let recaptchaVerifier: RecaptchaVerifier | null = null
let confirmationResult: ConfirmationResult | null = null

export function initRecaptcha(containerId: string) {
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      recaptchaVerifier = null
    },
  })
  return recaptchaVerifier
}

export function clearRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear()
    recaptchaVerifier = null
  }
}

export async function sendOTP(phoneNumber: string): Promise<void> {
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA not initialized')
  }
  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
}

export async function verifyOTP(code: string): Promise<FirebaseUser | null> {
  if (!confirmationResult) {
    throw new Error('No OTP sent. Call sendOTP first.')
  }
  const result = await confirmationResult.confirm(code)
  return result.user ?? null
}

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

  if (userSnap.exists()) {
    const existing = userSnap.data()
    await setDoc(userRef, {
      name: data.name || existing.name,
      email: data.email || existing.email || firebaseUser.email || '',
      whatsappNumber: whatsappNumber || existing.whatsappNumber || '',
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return { id: firebaseUser.uid, ...existing } as unknown as User
  }

  const referredBy = typeof window !== 'undefined' ? sessionStorage.getItem('traamand_ref') || '' : ''

  const newUser = {
    name: data.name,
    phone: data.phone || '',
    email: data.email || firebaseUser.email || '',
    whatsappNumber,
    addresses: [],
    bookings: [],
    favoriteWorkers: [],
    role: data.role || 'client',
    referralCode: generateReferralCode(),
    referredBy,
    earningsBalance: 0,
    referralClicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(userRef, newUser)

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
  clearRecaptcha()
  confirmationResult = null
  await signOut(auth)
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback)
}
