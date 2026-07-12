import * as admin from 'firebase-admin'
import { onRequest } from 'firebase-functions/v2/https'

function firestore() { return admin.firestore() }

interface WorkerData {
  slug: string
  displayName: string
  metaTitle: string
  metaDescription: string
  skills: string[]
  rating: number
  reviewCount: number
  experienceYears: number
  placementFee: number
  monthlySalaryRange: { min: number; max: number }
  availability: { preferredLocations: string[] }
  bio: string
  languages: string[]
  hireCount: number
  verificationStatus: string
  divineSeal: { idVerified: boolean; policeClearance: boolean; medicalClearance: boolean; trainingCompleted: boolean }
}

interface CategoryData {
  name: string
  slug: string
  description: string
  metaTitle: string
  metaDescription: string
}

const BASE_URL = 'https://traamand.co.zw'
const SITE_NAME = 'Traamand Employment Services'

function wrapHTML(title: string, description: string, canonical: string, body: string, jsonld: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#06afb8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${BASE_URL}/logo.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<link rel="canonical" href="${canonical}" />
<script type="application/ld+json">${jsonld}</script>
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/logo.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#fafafa;margin:0;padding:0}</style>
</head>
<body>
${body}
</body>
</html>`
}

async function renderWorkerPage(slug: string): Promise<string | null> {
  const snap = await firestore().collection('workers').where('slug', '==', slug).limit(1).get()
  if (snap.empty) return null
  const w = snap.docs[0].data() as WorkerData
  const skills = (w.skills || []).map((s) => s.replace(/-/g, ' ')).join(', ')
  const locations = (w.availability?.preferredLocations || []).join(', ')
  const sealStatus = w.verificationStatus === 'premium' ? 'Divine Seal Premium' : 'Divine Seal Verified'

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: w.displayName,
    jobTitle: w.skills?.[0]?.replace(/-/g, ' ') || 'Domestic Worker',
    worksFor: { '@type': 'Organization', name: SITE_NAME },
    address: { '@type': 'PostalAddress', addressLocality: locations.split(',')[0] || 'Harare', addressCountry: 'ZW' },
    description: w.bio?.slice(0, 160) || '',
    aggregateRating: { '@type': 'AggregateRating', ratingValue: w.rating?.toFixed(1) || '4.5', reviewCount: w.reviewCount || 0 },
  })

  const body = `
<main style="max-width:720px;margin:0 auto;padding:2rem">
  <a href="/" style="color:#06afb8;text-decoration:none">← Traamand</a>
  <h1 style="font-size:2.5rem;margin:1rem 0 0.5rem">${w.displayName}</h1>
  <p style="font-size:1.2rem;color:#555">${w.skills?.[0]?.replace(/-/g, ' ') || 'Domestic Worker'} · ${sealStatus}</p>
  <div style="display:flex;gap:1rem;margin:1rem 0;flex-wrap:wrap">
    <span>${w.rating} / 5 (${w.reviewCount} reviews)</span>
    <span>${w.experienceYears} years experience</span>
    <span>${w.hireCount} hires</span>
  </div>
  <p style="font-size:1.1rem;line-height:1.7;color:#333">${w.bio || ''}</p>
  <h2>Skills</h2>
  <p>${skills}</p>
  <h2>Languages</h2>
  <p>${(w.languages || []).join(', ')}</p>
  <h2>Service Areas</h2>
  <p>${locations}</p>
  <h2>Placement Fee: $${w.placementFee}</h2>
  <p>Monthly salary range: $${w.monthlySalaryRange?.min || 100}–$${w.monthlySalaryRange?.max || 250}</p>
  <a href="/book/${slug}" style="display:inline-block;background:#06afb8;color:white;padding:1rem 2rem;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:1rem">Book Now</a>
</main>`

  return wrapHTML(w.metaTitle, w.metaDescription, `${BASE_URL}/worker/${slug}`, body, jsonld)
}

async function renderCategoryPage(slug: string): Promise<string | null> {
  const snap = await firestore().collection('categories').where('slug', '==', slug).limit(1).get()
  if (snap.empty) return null
  const cat = snap.docs[0].data() as CategoryData

  const workersSnap = await firestore().collection('workers')
    .where('isActive', '==', true)
    .where('availability.status', '==', 'available')
    .limit(50)
    .get()

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${cat.name}s in Harare | Traamand`,
    description: cat.metaDescription,
    numberOfItems: workersSnap.size,
    itemListElement: workersSnap.docs.slice(0, 10).map((d, i) => {
      const w = d.data()
      return { '@type': 'ListItem', position: i + 1, name: w.displayName, url: `${BASE_URL}/worker/${w.slug}` }
    }),
  })

  const workerLinks = workersSnap.docs.slice(0, 10).map((d) => {
    const w = d.data()
    return `<li><a href="/worker/${w.slug}" style="color:#06afb8">${w.displayName}</a> — ${w.rating} (${w.skills?.[0]?.replace(/-/g, ' ') || 'Worker'})</li>`
  }).join('')

  const body = `
<main style="max-width:720px;margin:0 auto;padding:2rem">
  <a href="/" style="color:#06afb8;text-decoration:none">← Traamand</a>
  <h1 style="font-size:2.5rem;margin:1rem 0 0.5rem">${cat.name}s in Harare</h1>
  <p style="font-size:1.2rem;color:#555;line-height:1.7">${cat.description}</p>
  <h2>Available ${cat.name}s (${workersSnap.size})</h2>
  <ul style="line-height:2;font-size:1rem">${workerLinks}</ul>
  <p><a href="/hire/${slug}" style="color:#06afb8">View all ${cat.name.toLowerCase()}s with full filters →</a></p>
</main>`

  return wrapHTML(cat.metaTitle, cat.metaDescription, `${BASE_URL}/hire/${slug}`, body, jsonld)
}

async function renderHomepage(): Promise<string> {
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    description: 'Trusted domestic worker placement in Harare, Zimbabwe. Verified maids, nannies, chefs, gardeners, and more.',
    telephone: '+263 715 325 922',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Corner Jaison Mbuya Nehanda Street & Central Avenue, Azhari Building, Room 4A',
      addressLocality: 'Harare',
      addressCountry: 'ZW',
    },
    url: BASE_URL,
  })

  const catsSnap = await firestore().collection('categories').orderBy('sortOrder', 'asc').get()
  const catLinks = catsSnap.docs.map((d) => {
    const c = d.data()
    return `<li><a href="/hire/${c.slug}" style="color:#06afb8">${c.name}s</a> — ${c.description}</li>`
  }).join('')

  const body = `
<main style="max-width:720px;margin:0 auto;padding:2rem">
  <h1 style="font-size:2.5rem;margin:1rem 0 0.5rem">Traamand — Hire Verified Domestic Help in Harare</h1>
  <p style="font-size:1.2rem;color:#555;line-height:1.7">Traamand Employment Services connects you with document-verified, background-screened domestic workers in Harare, Zimbabwe. Every worker is Divine Seal verified — ID checked, police cleared, and reference confirmed. Hire in 3 minutes.</p>
  <h2>Staff Categories</h2>
  <ul style="line-height:2;font-size:1rem">${catLinks}</ul>
  <p><a href="/" style="display:inline-block;background:#06afb8;color:white;padding:1rem 2rem;border-radius:12px;text-decoration:none;font-weight:bold;margin-top:1rem">Find a Worker Now</a></p>
</main>`

  return wrapHTML(
    'Traamand Employment Services | Verified Domestic Workers in Harare',
    'Hire vetted, background-screened domestic workers in Harare, Zimbabwe. Maids, nannies, chefs, gardeners — book in 3 taps with the Divine Seal guarantee.',
    BASE_URL,
    body,
    jsonld
  )
}

export const prerender = onRequest({ region: 'us-central1' }, async (req, res) => {
  const path = (req.query.path as string) || '/'

  try {
    let html: string | null = null

    if (path === '/' || path === '') {
      html = await renderHomepage()
    } else if (path.startsWith('/worker/')) {
      const slug = path.replace('/worker/', '').split('?')[0]
      html = await renderWorkerPage(slug)
    } else if (path.startsWith('/hire/')) {
      const slug = path.replace('/hire/', '').split('?')[0].split('/')[0]
      html = await renderCategoryPage(slug)
    }

    if (html) {
      res.set('Content-Type', 'text/html')
      res.set('Cache-Control', 'public, max-age=3600, s-maxage=86400')
      res.send(html)
    } else {
      res.status(404).json({ error: 'Page not found' })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Prerender failed' })
  }
})
