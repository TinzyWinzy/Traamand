import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sa = JSON.parse(readFileSync(join(__dirname, '..', 'scripts', 'seed', 'serviceAccount.json'), 'utf-8'))
if (!getApps().length) initializeApp({ credential: cert(sa as any) })
const db = getFirestore()

const workers = await db.collection('workers').where('isActive', '==', true).get()
console.log('Total workers:', workers.size)

const maidKeywords = ['cleaning', 'maid', 'housekeeping', 'laundry']
const maids = workers.docs.filter((d) =>
  d.data().skills.some((s) => maidKeywords.some((k) => s.includes(k)))
)
console.log('Maids:', maids.length)
maids.forEach((d) => console.log('  -', d.data().displayName, d.data().rating))

process.exit(0)
