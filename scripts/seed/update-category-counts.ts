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

async function update() {
  const snap = await db.collection('workers').where('isActive', '==', true).get()

  const skillMap: Record<string, string[]> = {
    maids: ['cleaning', 'laundry', 'ironing', 'housekeeping', 'organization', 'pet-care', 'maid'],
    nannies: ['newborn-care', 'infant-care', 'childcare', 'nanny', 'toddler', 'sleep-training', 'early-childhood-education', 'early-education', 'cpr', 'first-aid'],
    chefs: ['cooking', 'baking', 'chef', 'meal', 'menu-planning', 'pastry', 'grilling', 'traditional-cuisine', 'event-catering'],
    gardeners: ['gardening', 'lawn', 'landscaping', 'garden', 'irrigation', 'hedge-trimming', 'pruning', 'composting', 'pest-control'],
    'nurse-aides': ['elderly', 'nurse', 'patient', 'medication', 'bedside-care', 'vital-signs', 'wound-care', 'mobility-support', 'first-aid'],
    drivers: ['driving', 'driver', 'chauffeur', 'route', 'school-runs', 'fleet-management', 'vehicle-maintenance'],
  }

  const counts: Record<string, number> = {}

  for (const doc of snap.docs) {
    const data = doc.data()
    const skills: string[] = data.skills || []
    for (const [category, keywords] of Object.entries(skillMap)) {
      if (skills.some((s) => keywords.some((k) => s.toLowerCase().includes(k)))) {
        counts[category] = (counts[category] || 0) + 1
      }
    }
  }

  console.log('Computed worker counts:')
  for (const [cat, count] of Object.entries(counts)) {
    console.log(`  ${cat}: ${count}`)
    await db.collection('categories').doc(cat).update({ workerCount: count, updatedAt: ts() })
  }

  console.log('\n✅ Category counts updated.')
  process.exit(0)
}

update().catch((err) => { console.error(err); process.exit(1) })
