import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf-8'))

if (!getApps().length) initializeApp({ credential: cert(serviceAccount as any) })
const db = getFirestore()
const ts = () => Timestamp.now()

const CLIENT_ID = 'demo-client-1'
const WORKER_IDS = [
  'maria-k-harare-maid',
  'grace-t-harare-maid',
  'tsitsi-m-harare-nanny',
  'michael-c-harare-chef',
]

const BOOKINGS = [
  {
    clientId: CLIENT_ID,
    clientName: 'Tendai Demo',
    clientEmail: 'tmandovha@gmail.com',
    clientPhone: '+263771234567',
    clientWhatsapp: '+263771234567',
    serviceType: 'Maid',
    workerId: WORKER_IDS[0],
    workerSlug: WORKER_IDS[0],
    workType: 'live-in',
    duration: '1 month',
    startDate: Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
    clientAddress: { suburb: 'Avondale', city: 'Harare', full: 'Avondale, Harare' },
    requirements: 'Deep cleaning, laundry, daily cooking',
    placementFee: 50,
    placementFeePaid: true,
    paynowStatus: 'paid',
    paynowReference: `TRA-${WORKER_IDS[0].slice(0, 8).toUpperCase()}`,
    status: 'started',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
  },
  {
    clientId: CLIENT_ID,
    clientName: 'Tendai Demo',
    clientEmail: 'tmandovha@gmail.com',
    clientPhone: '+263771234567',
    clientWhatsapp: '+263771234567',
    serviceType: 'Nanny',
    workerId: WORKER_IDS[2],
    workerSlug: WORKER_IDS[2],
    workType: 'daily',
    duration: '2 weeks trial',
    startDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
    clientAddress: { suburb: 'Borrowdale', city: 'Harare', full: 'Borrowdale, Harare' },
    requirements: 'Newborn care, CPR certified',
    placementFee: 55,
    placementFeePaid: false,
    paynowStatus: 'not_started',
    status: 'matched',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
  },
  {
    clientId: CLIENT_ID,
    clientName: 'Tendai Demo',
    clientEmail: 'tmandovha@gmail.com',
    clientPhone: '+263771234567',
    clientWhatsapp: '+263771234567',
    serviceType: 'Chef',
    workerId: WORKER_IDS[3],
    workerSlug: WORKER_IDS[3],
    workType: 'daily',
    duration: '1 month',
    startDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    clientAddress: { suburb: 'Mt Pleasant', city: 'Harare', full: 'Mt Pleasant, Harare' },
    requirements: 'Meal prep, dietary meals',
    placementFee: 60,
    placementFeePaid: true,
    paynowStatus: 'paid',
    paynowReference: `TRA-${WORKER_IDS[3].slice(0, 8).toUpperCase()}`,
    status: 'booked',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
  },
]

async function seedBookings() {
  console.log('📋 Seeding demo bookings...\n')
  for (const b of BOOKINGS) {
    const ref = db.collection('bookings').doc()
    await ref.set({
      ...b,
      id: ref.id,
      updatedAt: ts(),
    })
    console.log(`  ✅ ${b.serviceType} booking for ${b.clientAddress.suburb} (${b.status})`)
  }
  console.log(`\n🎉 Seeded ${BOOKINGS.length} bookings`)
}

seedBookings().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
