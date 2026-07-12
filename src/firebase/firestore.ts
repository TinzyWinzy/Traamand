import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  setDoc,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'
import type { Worker, Booking, User, Category, LocationPage, Applicant } from '../types'

const workersCol = () => collection(db, 'workers')
const bookingsCol = () => collection(db, 'bookings')
const categoriesCol = () => collection(db, 'categories')
const locationPagesCol = () => collection(db, 'locationPages')

export async function getWorker(slug: string): Promise<Worker | null> {
  const q = query(workersCol(), where('slug', '==', slug), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as Worker
}

export async function getWorkers(constraints: QueryConstraint[] = []): Promise<Worker[]> {
  const baseQuery = query(workersCol(), where('isActive', '==', true), ...constraints)
  const snap = await getDocs(baseQuery)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Worker)
}

export async function getAvailableWorkers(): Promise<Worker[]> {
  return getWorkers([
    where('availability.status', '==', 'available'),
    orderBy('rating', 'desc'),
    limit(50),
  ])
}

export async function getWorkersByCategory(category: string): Promise<Worker[]> {
  return getWorkers([
    where('skills', 'array-contains', category.toLowerCase()),
    orderBy('rating', 'desc'),
    limit(50),
  ])
}

export async function getWorkersByLocation(
  suburb: string,
  category?: string
): Promise<Worker[]> {
  const constraints: QueryConstraint[] = [
    where('availability.preferredLocations', 'array-contains', suburb),
    orderBy('rating', 'desc'),
    limit(50),
  ]
  const snap = await getDocs(query(workersCol(), where('isActive', '==', true), ...constraints))
  let results = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Worker)
  if (category) {
    results = results.filter((w) =>
      w.skills.some((s) => s.toLowerCase() === category.toLowerCase())
    )
  }
  return results
}

export async function getCategories(): Promise<Category[]> {
  const q = query(categoriesCol(), orderBy('sortOrder', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)
}

export async function getCategory(slug: string): Promise<Category | null> {
  const q = query(categoriesCol(), where('slug', '==', slug), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const docSnap = snap.docs[0]
  return { id: docSnap.id, ...docSnap.data() } as Category
}

export async function getClientBookings(clientId: string): Promise<Booking[]> {
  const q = query(
    bookingsCol(),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)
}

export async function getBooking(bookingId: string): Promise<Booking | null> {
  const docSnap = await getDoc(doc(bookingsCol(), bookingId))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as Booking
}

export async function createBooking(
  data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(bookingsCol(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateBooking(
  bookingId: string,
  data: Partial<Booking>
): Promise<void> {
  const bookingRef = doc(bookingsCol(), bookingId)
  await setDoc(bookingRef, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getLocationPage(
  city: string,
  suburb: string,
  serviceType: string
): Promise<LocationPage | null> {
  const id = `${city.toLowerCase()}-${suburb.toLowerCase()}-${serviceType.toLowerCase()}`.replace(/\s+/g, '-')
  const docSnap = await getDoc(doc(locationPagesCol(), id))
  if (!docSnap.exists()) return null
  return { id: docSnap.id, ...docSnap.data() } as LocationPage
}

export async function getLocationPages(
  city?: string,
  serviceType?: string
): Promise<LocationPage[]> {
  let constraints: QueryConstraint[] = []
  if (city) constraints.push(where('city', '==', city))
  if (serviceType) constraints.push(where('serviceType', '==', serviceType))
  const q = query(locationPagesCol(), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LocationPage)
}

const applicantsCol = () => collection(db, 'applicants')

export async function createApplicant(data: Omit<Applicant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await addDoc(applicantsCol(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getApplicants(): Promise<Applicant[]> {
  const q = query(applicantsCol(), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Applicant)
}

export async function getApplicantsByPhone(phone: string): Promise<Applicant[]> {
  const q = query(applicantsCol(), where('phone', '==', phone), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Applicant)
}

export async function updateApplicant(applicantId: string, data: Partial<Applicant>): Promise<void> {
  const ref = doc(applicantsCol(), applicantId)
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('phone', '==', phone), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as User
}
