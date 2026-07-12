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
  updateDoc,
  deleteDoc,
  serverTimestamp,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'
import type { Worker, Booking, User, UserRole, Category, LocationPage, Applicant, Transaction, Payout, PayoutMethod, TransactionType, VerifierTask, CreatorSubmission, Sponsorship, AdCampaign, Invite } from '../types'

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
  const snap = await getDocs(workersCol())
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Worker)
    .filter((w) => w.isActive && w.availability?.status === 'available')
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

export async function getUsers(): Promise<User[]> {
  const snap = await getDocs(collection(db, 'users'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User)
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const ref = doc(db, 'users', userId)
  await setDoc(ref, { role, updatedAt: serverTimestamp() }, { merge: true })
}

export async function getApplicantsByUserId(userId: string): Promise<Applicant[]> {
  const q = query(applicantsCol(), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Applicant)
}

// ── Transactions (ledger) ──

const transactionsCol = () => collection(db, 'transactions')

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(transactionsCol(), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const q = query(transactionsCol(), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction)
}

// ── Payouts ──

const payoutsCol = () => collection(db, 'payouts')

export async function requestPayout(
  data: Omit<Payout, 'id' | 'requestedAt' | 'completedAt' | 'status' | 'fee'>
): Promise<string> {
  const docRef = await addDoc(payoutsCol(), {
    ...data,
    fee: 0,
    status: 'pending',
    requestedAt: serverTimestamp(),
    completedAt: null,
  })
  return docRef.id
}

export async function getPayouts(userId: string): Promise<Payout[]> {
  const q = query(payoutsCol(), where('userId', '==', userId), orderBy('requestedAt', 'desc'), limit(50))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Payout)
}

// ── Referral codes ──

export async function getUserByReferralCode(code: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('referralCode', '==', code.toUpperCase()), limit(1))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as User
}

export async function setReferralCode(userId: string, code: string): Promise<void> {
  const ref = doc(db, 'users', userId)
  await setDoc(ref, { referralCode: code.toUpperCase() }, { merge: true })
}

export async function setReferredBy(userId: string, referrerCode: string): Promise<void> {
  const ref = doc(db, 'users', userId)
  await setDoc(ref, { referredBy: referrerCode.toUpperCase() }, { merge: true })
}

export async function incrementReferralClick(code: string): Promise<void> {
  const user = await getUserByReferralCode(code)
  if (!user) return
  const ref = doc(db, 'users', user.id)
  await setDoc(ref, { referralClicks: (user.referralClicks || 0) + 1 }, { merge: true })
}

export async function getReferralStats(userId: string): Promise<{ clicks: number; signups: number; referrals: User[] }> {
  const userSnap = await getDoc(doc(db, 'users', userId))
  if (!userSnap.exists()) return { clicks: 0, signups: 0, referrals: [] }

  const code = userSnap.data().referralCode
  if (!code) return { clicks: 0, signups: 0, referrals: [] }

  const q = query(collection(db, 'users'), where('referredBy', '==', code), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  const referrals = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User)

  return {
    clicks: userSnap.data().referralClicks || 0,
    signups: referrals.length,
    referrals,
  }
}

// ── Verifier tasks ──

const verifierTasksCol = () => collection(db, 'verifierTasks')

export async function createVerifierTask(
  data: Omit<VerifierTask, 'id' | 'createdAt' | 'assignedAt' | 'completedAt' | 'status'>
): Promise<string> {
  const docRef = await addDoc(verifierTasksCol(), {
    ...data,
    status: 'open',
    assignedAt: null,
    completedAt: null,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getOpenVerifierTasks(): Promise<VerifierTask[]> {
  const q = query(verifierTasksCol(), where('status', '==', 'open'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VerifierTask)
}

export async function getVerifierTasksByVerifier(verifierId: string): Promise<VerifierTask[]> {
  const q = query(verifierTasksCol(), where('assignedTo', '==', verifierId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VerifierTask)
}

export async function acceptVerifierTask(taskId: string, verifierId: string): Promise<void> {
  const ref = doc(verifierTasksCol(), taskId)
  await setDoc(ref, { status: 'assigned', assignedTo: verifierId, assignedAt: serverTimestamp() }, { merge: true })
}

export async function completeVerifierTask(taskId: string, resultNotes: string): Promise<void> {
  const ref = doc(verifierTasksCol(), taskId)
  await setDoc(ref, { status: 'completed', resultNotes, completedAt: serverTimestamp() }, { merge: true })
}

export async function getVerifierTasksByApplicant(applicantId: string): Promise<VerifierTask[]> {
  const q = query(verifierTasksCol(), where('applicantId', '==', applicantId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VerifierTask)
}

// ── Ambassador / network ──

export async function getReferralTree(userId: string): Promise<{
  level1: User[]
  level2: User[]
  level3: User[]
}> {
  const userSnap = await getDoc(doc(db, 'users', userId))
  if (!userSnap.exists()) return { level1: [], level2: [], level3: [] }

  const code = userSnap.data().referralCode
  if (!code) return { level1: [], level2: [], level3: [] }

  const level1Snap = await getDocs(query(collection(db, 'users'), where('referredBy', '==', code)))
  const level1 = level1Snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User)

  const l2Codes = level1.map((u) => u.referralCode).filter(Boolean)
  const level2 = l2Codes.length > 0
    ? (await getDocs(query(collection(db, 'users'), where('referredBy', 'in', l2Codes.slice(0, 30))))).docs
        .map((d) => ({ id: d.id, ...d.data() }) as User)
    : []

  const l3Codes = level2.map((u) => u.referralCode).filter(Boolean)
  const level3 = l3Codes.length > 0
    ? (await getDocs(query(collection(db, 'users'), where('referredBy', 'in', l3Codes.slice(0, 30))))).docs
        .map((d) => ({ id: d.id, ...d.data() }) as User)
    : []

  return { level1, level2, level3 }
}

export async function getLeaderboard(): Promise<(User & { referralSignups: number })[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('earningsBalance', 'desc'), limit(50)))
  return snap.docs.map((d) => {
    const data = d.data()
    return { id: d.id, ...data, referralSignups: 0 }
  }) as (User & { referralSignups: number })[]
}

export async function getTopReferrers(): Promise<{ id: string; name: string; count: number }[]> {
  const snap = await getDocs(collection(db, 'users'))
  const refMap = new Map<string, number>()
  snap.docs.forEach((d) => {
    const ref = d.data().referredBy
    if (ref) refMap.set(ref, (refMap.get(ref) || 0) + 1)
  })
  const sorted = [...refMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
  const results: { id: string; name: string; count: number }[] = []
  for (const [code, count] of sorted) {
    const userSnap = await getDocs(query(collection(db, 'users'), where('referralCode', '==', code), limit(1)))
    if (!userSnap.empty) {
      const u = userSnap.docs[0].data()
      results.push({ id: userSnap.docs[0].id, name: u.name || 'Anonymous', count })
    }
  }
  return results
}

// ── Creator Fund ──

const creatorSubmissionsCol = () => collection(db, 'creatorSubmissions')

export async function createCreatorSubmission(
  data: Omit<CreatorSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'payoutAmount' | 'adminNotes'>
): Promise<string> {
  const docRef = await addDoc(creatorSubmissionsCol(), {
    ...data,
    status: 'pending',
    payoutAmount: 0,
    adminNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getCreatorSubmissions(userId: string): Promise<CreatorSubmission[]> {
  const q = query(creatorSubmissionsCol(), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as CreatorSubmission)
}

// ── Sponsorships ──

const sponsorshipsCol = () => collection(db, 'sponsorships')

export async function createSponsorship(
  data: Omit<Sponsorship, 'id' | 'createdAt' | 'nextPaymentDate' | 'status' | 'traamandFee'>
): Promise<string> {
  const docRef = await addDoc(sponsorshipsCol(), {
    ...data,
    traamandFee: Math.round(data.monthlyBudget * 0.08 * 100) / 100,
    status: 'active',
    nextPaymentDate: null,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getSponsorships(sponsorId: string): Promise<Sponsorship[]> {
  const q = query(sponsorshipsCol(), where('sponsorId', '==', sponsorId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Sponsorship)
}

// ── Ad Campaigns ──

const adCampaignsCol = () => collection(db, 'adCampaigns')

export async function createAdCampaign(
  data: Omit<AdCampaign, 'id' | 'createdAt' | 'updatedAt' | 'spend' | 'impressions' | 'clicks' | 'conversions' | 'status'>
): Promise<string> {
  const docRef = await addDoc(adCampaignsCol(), {
    ...data,
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getAdCampaigns(userId: string): Promise<AdCampaign[]> {
  const q = query(adCampaignsCol(), where('userId', '==', userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AdCampaign)
}

// ── Invites ──

const invitesCol = () => collection(db, 'invites')

export async function createInvite(email: string, role: UserRole, invitedBy: string): Promise<string> {
  const docRef = await addDoc(invitesCol(), {
    email: email.toLowerCase().trim(),
    role,
    invitedBy,
    accepted: false,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getInviteByEmail(email: string): Promise<Invite | null> {
  const q = query(invitesCol(), where('email', '==', email.toLowerCase().trim()), where('accepted', '==', false))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as Invite
}

export async function getInvites(): Promise<Invite[]> {
  const q = query(invitesCol(), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Invite)
}

export async function deleteInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(db, 'invites', inviteId))
}

export async function markInviteAccepted(inviteId: string): Promise<void> {
  await updateDoc(doc(db, 'invites', inviteId), { accepted: true })
}
