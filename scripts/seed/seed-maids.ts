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

const MAIDS = [
  {
    firstName: 'Anna', lastName: 'Chirwa', displayName: 'Anna C.', slug: 'anna-c-harare-maid',
    skills: ['cleaning', 'laundry', 'ironing', 'childcare'],
    languages: ['Shona', 'English'],
    locations: ['Avondale', 'Mt Pleasant', 'Belgravia'],
    workType: ['live-in', 'daily'],
    rating: 4.8, reviewCount: 28, hireCount: 28,
    exp: 6, placementFee: 50, salaryMin: 120, salaryMax: 200,
    bio: 'Meticulous housekeeper with a warm personality. Specializes in laundry and ironing — clothes always pressed perfectly. 6 years serving families across Harare North and Central.',
  },
  {
    firstName: 'Melody', lastName: 'Gumbo', displayName: 'Melody G.', slug: 'melody-g-harare-maid',
    skills: ['cleaning', 'cooking', 'elderly-care', 'organization'],
    languages: ['Shona', 'English'],
    locations: ['Borrowdale', 'Chisipite', 'Glen Lorne'],
    workType: ['live-in', 'daily'],
    rating: 4.9, reviewCount: 35, hireCount: 35,
    exp: 9, placementFee: 55, salaryMin: 140, salaryMax: 230,
    bio: 'Senior domestic professional with a heart for elderly care. Can cook traditional and Western meals. Highly recommended by expatriate families in Borrowdale.',
  },
  {
    firstName: 'Netsai', lastName: 'Moyo', displayName: 'Netsai M.', slug: 'netsai-m-harare-maid',
    skills: ['cleaning', 'laundry', 'pet-care', 'gardening'],
    languages: ['Ndebele', 'English', 'Shona'],
    locations: ['Mabelreign', 'Marlborough', 'Avondale'],
    workType: ['daily', 'part-time', 'temporary'],
    rating: 4.5, reviewCount: 16, hireCount: 16,
    exp: 3, placementFee: 40, salaryMin: 80, salaryMax: 150,
    bio: 'Energetic and versatile helper. Great with pets, loves gardening. Speaks three languages. Ideal for families needing flexible part-time help in Harare West.',
  },
  {
    firstName: 'Farai', lastName: 'Ncube', displayName: 'Farai N.', slug: 'farai-n-harare-maid',
    skills: ['cleaning', 'cooking', 'laundry', 'childcare'],
    languages: ['Shona', 'English'],
    locations: ['Greendale', 'Highlands', 'Newlands'],
    workType: ['live-in', 'daily'],
    rating: 4.7, reviewCount: 22, hireCount: 22,
    exp: 5, placementFee: 50, salaryMin: 110, salaryMax: 190,
    bio: 'Reliable and trustworthy domestic worker. Experienced with toddlers and young children. Known for delicious traditional meals and spotless homes.',
  },
  {
    firstName: 'Tatenda', lastName: 'Sithole', displayName: 'Tatenda S.', slug: 'tatenda-s-harare-maid',
    skills: ['cleaning', 'laundry', 'ironing'],
    languages: ['Shona'],
    locations: ['Hatfield', 'Kensington', 'Eastlea'],
    workType: ['live-in', 'daily', 'temporary'],
    rating: 4.3, reviewCount: 9, hireCount: 9,
    exp: 2, placementFee: 35, salaryMin: 70, salaryMax: 130,
    bio: 'Young, enthusiastic domestic worker eager to prove herself. Quick learner, strong work ethic. Excellent ironing skills. Looking for her first long-term position.',
  },
  {
    firstName: 'Mavis', lastName: 'Nyathi', displayName: 'Mavis N.', slug: 'mavis-n-harare-maid',
    skills: ['cleaning', 'cooking', 'baking', 'elderly-care'],
    languages: ['Ndebele', 'English'],
    locations: ['Belgravia', 'Eastlea', 'Meyrick Park'],
    workType: ['live-in', 'daily'],
    rating: 4.8, reviewCount: 31, hireCount: 31,
    exp: 8, placementFee: 55, salaryMin: 130, salaryMax: 220,
    bio: 'Skilled cook and baker with a nurturing touch. Makes amazing scones and cakes. Gentle with elderly family members. Trusted by Harare Central families for nearly a decade.',
  },
  {
    firstName: 'Sandra', lastName: 'Zhou', displayName: 'Sandra Z.', slug: 'sandra-z-harare-maid',
    skills: ['cleaning', 'laundry', 'childcare', 'driving'],
    languages: ['Shona', 'English'],
    locations: ['Mt Pleasant', 'Avondale', 'Borrowdale'],
    workType: ['daily', 'part-time'],
    rating: 4.6, reviewCount: 15, hireCount: 15,
    exp: 4, placementFee: 45, salaryMin: 100, salaryMax: 180,
    bio: 'Modern domestic professional with a driver\'s license. Can run errands, do school pickups, and manage the household. Perfect for busy working couples in Mt Pleasant.',
  },
  {
    firstName: 'Edna', lastName: 'Chikomo', displayName: 'Edna C.', slug: 'edna-c-harare-maid',
    skills: ['cleaning', 'organization', 'laundry', 'pet-care'],
    languages: ['Shona', 'English'],
    locations: ['Borrowdale', 'Gunhill', 'Chisipite'],
    workType: ['live-in', 'daily'],
    rating: 4.9, reviewCount: 41, hireCount: 41,
    exp: 11, placementFee: 60, salaryMin: 150, salaryMax: 260,
    bio: 'Elite domestic professional with 11 years of impeccable service. Marie Kondo-level organization skills. Transforms chaotic homes into model households. Worth every dollar.',
  },
]

async function seedMaids() {
  console.log('👩‍🍳 Seeding additional maids...\n')

  for (const m of MAIDS) {
    const docRef = db.collection('workers').doc()

    const fullVerification = m.rating >= 4.7

    await docRef.set({
      firstName: m.firstName,
      lastName: m.lastName,
      displayName: m.displayName,
      slug: m.slug,
      verificationStatus: m.rating >= 4.8 ? 'premium' : 'verified',
      divineSeal: {
        idVerified: true,
        policeClearance: fullVerification,
        referenceVideoUrl: '',
        medicalClearance: m.rating >= 4.8,
        trainingCompleted: m.rating >= 4.6,
        verifiedAt: ts(),
        verifiedBy: 'admin',
      },
      photos: [],
      bio: m.bio,
      languages: m.languages,
      skills: m.skills,
      experienceYears: m.exp,
      previousEmployers: Math.floor(m.hireCount * 0.7),
      availability: {
        status: 'available',
        nextAvailable: null,
        preferredLocations: m.locations,
        workType: m.workType,
      },
      rating: m.rating,
      reviewCount: m.reviewCount,
      recentReviews: [],
      hireCount: m.hireCount,
      lastHiredAt: ts(),
      placementFee: m.placementFee,
      monthlySalaryRange: { min: m.salaryMin, max: m.salaryMax },
      metaTitle: `${m.displayName} - Verified Maid in Harare | Traamand`,
      metaDescription: `${m.displayName} is a Divine Seal verified maid in Harare with ${m.exp} years experience. ${m.rating}-star rating from ${m.reviewCount} reviews. Available in ${m.locations.slice(0, 2).join(', ')}.`,
      serviceAreas: m.locations,
      isActive: true,
      createdAt: ts(),
      updatedAt: ts(),
    })
    console.log(`  ✅ ${m.displayName} — ${m.rating} (${m.reviewCount} reviews) — ${m.locations.slice(0, 2).join(', ')}`)
  }

  console.log(`\n🎉 Added ${MAIDS.length} maids to Firestore.`)
  process.exit(0)
}

seedMaids().catch((err) => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
