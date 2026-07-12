import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sa = JSON.parse(readFileSync(join(__dirname, 'seed', 'serviceAccount.json'), 'utf-8'))
if (!getApps().length) initializeApp({ credential: cert(sa as any) })
const db = getFirestore()

async function check() {
  const all = await db.collection('workers').where('isActive', '==', true).get()
  console.log('Total workers:', all.size)

  let available = 0
  let notAvailable = 0
  let missingStatus = 0

  for (const doc of all.docs) {
    const d = doc.data()
    const status = d.availability?.status
    if (!status) {
      missingStatus++
      console.log(`  ❌ NO STATUS: ${d.displayName} — availability:`, JSON.stringify(d.availability))
    } else if (status === 'available') {
      available++
    } else {
      notAvailable++
      console.log(`  ⚠️  NOT AVAILABLE: ${d.displayName} — status: ${status}`)
    }
  }

  console.log(`\nAvailable: ${available}`)
  console.log(`Not available: ${notAvailable}`)
  console.log(`Missing status: ${missingStatus}`)

  if (missingStatus > 0 || notAvailable > 0) {
    console.log('\nFixing availability status for all workers...')
    const batch = db.batch()
    for (const doc of all.docs) {
      const ref = db.collection('workers').doc(doc.id)
      batch.update(ref, { 'availability.status': 'available' })
    }
    await batch.commit()
    console.log('✅ All workers set to available.')
  }

  process.exit(0)
}

check().catch(console.error)
