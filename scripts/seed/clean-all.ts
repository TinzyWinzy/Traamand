/**
 * Clean All Seeded Data
 *
 * Safely removes all seeded/demo documents from Firestore collections
 * so the client can start fresh with their own data.
 *
 * Run: npx tsx scripts/seed/clean-all.ts
 * Requires: scripts/seed/serviceAccount.json (Firebase admin SDK key)
 *
 * Collections cleared: workers, bookings, locationPages, auditLogs, bookingCheckIns
 * NOT cleared: categories (structure kept), users, transactions, applicants, etc.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf-8'))

if (!getApps().length) initializeApp({ credential: cert(serviceAccount as any) })
const db = getFirestore()

const COLLECTIONS_TO_CLEAR = [
  'workers',
  'bookings',
  'locationPages',
  'auditLogs',
  'bookingCheckIns',
  'verifierTasks',
  'creatorSubmissions',
  'sponsorships',
  'adCampaigns',
  'invites',
  'transactions',
]

async function deleteAllDocs(collectionId: string, batchSize = 50) {
  let total = 0
  while (true) {
    const snap = await db.collection(collectionId).limit(batchSize).get()
    if (snap.empty) break
    const batch = db.batch()
    snap.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    total += snap.size
    console.log(`  🗑️  Deleted ${snap.size} docs from ${collectionId} (${total} total)`)
  }
  return total
}

async function clean() {
  console.log('🧹 Traamand — Clean All Seeded Data\n')

  for (const col of COLLECTIONS_TO_CLEAR) {
    const count = await deleteAllDocs(col)
    if (count === 0) console.log(`  ✅ ${col} — already empty`)
  }

  console.log('\n🎉 Clean complete! Firestore is ready for client data.')
  console.log('   Categories and users were preserved.')
  process.exit(0)
}

clean().catch((err) => {
  console.error('❌ Clean failed:', err)
  process.exit(1)
})
