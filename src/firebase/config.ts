import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getVertexAI } from '@firebase/vertexai'

const firebaseConfig = {
  apiKey: 'AIzaSyAtuEkZ3OygKl1GkleK736gSgowTH0Q2kk',
  authDomain: 'studio-8895863664-52c12.firebaseapp.com',
  projectId: 'studio-8895863664-52c12',
  storageBucket: 'studio-8895863664-52c12.firebasestorage.app',
  messagingSenderId: '1717332991',
  appId: '1:1717332991:web:aab039115f8d1f1f7a15ca',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app, 'us-central1')
export const vertexAI = getVertexAI(app)

export default app
