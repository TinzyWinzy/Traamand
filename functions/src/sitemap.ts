import * as admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'

function firestore() { return admin.firestore() }

const BASE_URL = 'https://traamand.co.zw'

const STATIC_SEO_PAGES = [
  { path: '/maids-in-harare', priority: '0.95', changefreq: 'weekly' },
  { path: '/house-cleaning-harare', priority: '0.95', changefreq: 'weekly' },
  { path: '/domestic-workers-harare', priority: '0.95', changefreq: 'weekly' },
  { path: '/gardeners-in-harare', priority: '0.85', changefreq: 'weekly' },
  { path: '/nurse-aides-harare', priority: '0.85', changefreq: 'weekly' },
  { path: '/drivers-in-harare', priority: '0.85', changefreq: 'weekly' },
  { path: '/domestic-worker-jobs-harare', priority: '0.9', changefreq: 'weekly' },
  { path: '/domestic-worker-jobs-zimbabwe', priority: '0.85', changefreq: 'weekly' },
] as const

async function generateSitemap(): Promise<string> {
  const urls: string[] = []

  urls.push(`  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`)
  STATIC_SEO_PAGES.forEach((page) => {
    urls.push(`  <url><loc>${BASE_URL}${page.path}</loc><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`)
  })

  const categoriesSnap = await firestore().collection('categories').orderBy('sortOrder', 'asc').get()
  categoriesSnap.docs.forEach((doc) => {
    const cat = doc.data()
    urls.push(`  <url><loc>${BASE_URL}/hire/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`)
  })

  const workersSnap = await firestore()
    .collection('workers')
    .where('isActive', '==', true)
    .get()
  workersSnap.docs.forEach((doc) => {
    const w = doc.data()
    urls.push(`  <url><loc>${BASE_URL}/worker/${w.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
  })

  const locationPagesSnap = await firestore().collection('locationPages').get()
  locationPagesSnap.docs.forEach((doc) => {
    const data = doc.data()
    const serviceType = data.serviceType?.toLowerCase()
    const city = data.city?.toLowerCase()
    const suburb = data.suburb?.toLowerCase()
    if (serviceType && city && suburb && serviceType !== 'undefined' && city !== 'undefined' && suburb !== 'undefined') {
      urls.push(`  <url><loc>${BASE_URL}/hire/${serviceType}/${city}/${suburb}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
    }
  })

  urls.push(`  <url><loc>${BASE_URL}/available-staff</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`)
  urls.push(`  <url><loc>${BASE_URL}/find-a-maid</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`)
  urls.push(`  <url><loc>${BASE_URL}/join-our-team</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`)

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

export const sitemap = onRequest({ region: 'us-central1' }, async (req, res) => {
  res.set('Content-Type', 'application/xml')
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
  try {
    const xml = await generateSitemap()
    res.send(xml)
  } catch (err) {
    console.error(err)
    res.status(500).send('Sitemap generation failed')
  }
})
