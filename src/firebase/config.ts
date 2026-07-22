import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getAI } from 'firebase/ai'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyAtuEkZ3OygKl1GkleK736gSgowTH0Q2kk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'studio-8895863664-52c12.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'studio-8895863664-52c12',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'studio-8895863664-52c12.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1717332991',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:1717332991:web:aab039115f8d1f1f7a15ca',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'us-central1')
export const ai = getAI(app)

export default app
