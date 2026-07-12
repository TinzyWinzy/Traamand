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
    firstName: 'Beatrice', lastName: 'Chikwanha', displayName: 'Beatrice C.', slug: 'beatrice-c-harare-maid',
    skills: ['cleaning', 'laundry', 'cooking', 'childcare'],
    languages: ['Shona', 'English'],
    locations: ['Avondale', 'Mt Pleasant', 'Marlborough'],
    workType: ['live-in', 'daily'],
    rating: 4.7, reviewCount: 25, hireCount: 25,
    exp: 7, placementFee: 50, salaryMin: 120, salaryMax: 200,
    bio: 'Experienced domestic worker with a gift for childcare. Kids love her playful yet disciplined approach. Equally skilled in housekeeping and Zimbabwean cuisine.',
  },
  {
    firstName: 'Catherine', lastName: 'Mudimu', displayName: 'Catherine M.', slug: 'catherine-m-harare-maid',
    skills: ['cleaning', 'laundry', 'ironing', 'organization'],
    languages: ['Shona'],
    locations: ['Greendale', 'Highlands', 'Newlands'],
    workType: ['live-in', 'daily', 'part-time'],
    rating: 4.6, reviewCount: 19, hireCount: 19,
    exp: 4, placementFee: 45, salaryMin: 100, salaryMax: 170,
    bio: 'Immaculate home organizer with an eye for detail. Specializes in deep cleaning, linen care, and wardrobe organization. Quiet, focused, and efficient.',
  },
  {
    firstName: 'Diana', lastName: 'Mpofu', displayName: 'Diana M.', slug: 'diana-m-harare-maid',
    skills: ['cleaning', 'cooking', 'baking', 'elderly-care'],
    languages: ['Ndebele', 'English', 'Shona'],
    locations: ['Belgravia', 'Eastlea', 'Meyrick Park'],
    workType: ['live-in', 'daily'],
    rating: 4.9, reviewCount: 44, hireCount: 44,
    exp: 10, placementFee: 60, salaryMin: 150, salaryMax: 250,
    bio: 'Highly respected domestic professional with a decade of service. Known for her delicious baked goods and gentle elderly care. Speaks three languages fluently.',
  },
  {
    firstName: 'Ellen', lastName: 'Mangena', displayName: 'Ellen M.', slug: 'ellen-m-harare-maid',
    skills: ['cleaning', 'laundry', 'childcare', 'pet-care'],
    languages: ['Shona', 'English'],
    locations: ['Borrowdale', 'Chisipite', 'Glen Lorne'],
    workType: ['live-in', 'daily', 'temporary'],
    rating: 4.5, reviewCount: 14, hireCount: 14,
    exp: 3, placementFee: 40, salaryMin: 90, salaryMax: 160,
    bio: 'Friendly and adaptable young woman who is great with children and animals. Willing to learn new skills. Perfect for families needing a warm, reliable helper.',
  },
  {
    firstName: 'Florence', lastName: 'Sibanda', displayName: 'Florence S.', slug: 'florence-s-harare-maid',
    skills: ['cleaning', 'cooking', 'laundry', 'meal-planning'],
    languages: ['Ndebele', 'English'],
    locations: ['Hatfield', 'Kensington', 'Avondale'],
    workType: ['daily', 'part-time'],
    rating: 4.4, reviewCount: 11, hireCount: 11,
    exp: 5, placementFee: 40, salaryMin: 90, salaryMax: 150,
    bio: 'Meal-planning specialist who can prepare a week\'s menu in one session. Efficient cleaner who values time management. Available for daily and part-time arrangements.',
  },
  {
    firstName: 'Gladys', lastName: 'Makuvaza', displayName: 'Gladys M.', slug: 'gladys-m-harare-maid',
    skills: ['cleaning', 'laundry', 'ironing', 'childcare', 'cooking'],
    languages: ['Shona', 'English'],
    locations: ['Mabelreign', 'Marlborough', 'Mt Pleasant'],
    workType: ['live-in', 'daily'],
    rating: 4.8, reviewCount: 33, hireCount: 33,
    exp: 8, placementFee: 55, salaryMin: 130, salaryMax: 210,
    bio: 'All-round domestic gem. Cooks, cleans, cares for children, and presses clothes like a professional dry cleaner. A wonderful find for any Harare West family.',
  },
  {
    firstName: 'Hilda', lastName: 'Nyambiya', displayName: 'Hilda N.', slug: 'hilda-n-harare-maid',
    skills: ['cleaning', 'laundry', 'elderly-care', 'organization'],
    languages: ['Shona'],
    locations: ['Greendale', 'Highlands', 'Newlands'],
    workType: ['live-in', 'daily'],
    rating: 4.7, reviewCount: 20, hireCount: 20,
    exp: 6, placementFee: 50, salaryMin: 110, salaryMax: 190,
    bio: 'Patient and methodical worker with extensive elderly care experience. Creates orderly, calm homes. Highly recommended by Greendale families for her gentle nature.',
  },
  {
    firstName: 'Irene', lastName: 'Gwatidzo', displayName: 'Irene G.', slug: 'irene-g-harare-maid',
    skills: ['cleaning', 'cooking', 'laundry', 'baking'],
    languages: ['Shona', 'English'],
    locations: ['Borrowdale', 'Gunhill', 'Mt Pleasant'],
    workType: ['live-in', 'daily'],
    rating: 4.6, reviewCount: 17, hireCount: 17,
    exp: 5, placementFee: 50, salaryMin: 110, salaryMax: 190,
    bio: 'Talented home cook who can whip up anything from traditional sadza to lasagna. Keeps a spotless kitchen. Reliable and always punctual.',
  },
  {
    firstName: 'Joyce', lastName: 'Mandizvidza', displayName: 'Joyce M.', slug: 'joyce-m-harare-maid',
    skills: ['cleaning', 'laundry', 'ironing', 'pet-care'],
    languages: ['Shona', 'English'],
    locations: ['Avondale', 'Mabelreign', 'Belgravia'],
    workType: ['daily', 'part-time', 'temporary'],
    rating: 4.3, reviewCount: 9, hireCount: 9,
    exp: 2, placementFee: 35, salaryMin: 80, salaryMax: 140,
    bio: 'Eager young worker building her career in domestic service. Already proficient in cleaning, laundry, and pet care. Great attitude and fast learner.',
  },
  {
    firstName: 'Loveness', lastName: 'Chikomo', displayName: 'Loveness C.', slug: 'loveness-c-harare-maid',
    skills: ['cleaning', 'cooking', 'childcare', 'elderly-care'],
    languages: ['Shona', 'English'],
    locations: ['Chisipite', 'Glen Lorne', 'Borrowdale'],
    workType: ['live-in', 'daily'],
    rating: 4.9, reviewCount: 39, hireCount: 39,
    exp: 9, placementFee: 60, salaryMin: 140, salaryMax: 240,
    bio: 'A domestic treasure with 9 years of flawless service. Combines exceptional cleaning with compassionate care for children and elderly family members.',
  },
  {
    firstName: 'Margaret', lastName: 'Dzingai', displayName: 'Margaret D.', slug: 'margaret-d-harare-maid',
    skills: ['cleaning', 'laundry', 'organization', 'meal-preparation'],
    languages: ['Shona'],
    locations: ['Hatfield', 'Kensington', 'Eastlea'],
    workType: ['live-in', 'daily', 'part-time'],
    rating: 4.5, reviewCount: 13, hireCount: 13,
    exp: 4, placementFee: 40, salaryMin: 90, salaryMax: 160,
    bio: 'Practical and hardworking domestic assistant who takes pride in order. Her meal-preparation service saves families hours every week. English learner but understands instructions well.',
  },
  {
    firstName: 'Shamiso', lastName: 'Murwira', displayName: 'Shamiso M.', slug: 'shamiso-m-harare-maid',
    skills: ['cleaning', 'cooking', 'gardening', 'laundry'],
    languages: ['Shona', 'English'],
    locations: ['Marlborough', 'Avondale', 'Mabelreign'],
    workType: ['live-in', 'daily'],
    rating: 4.7, reviewCount: 24, hireCount: 24,
    exp: 6, placementFee: 50, salaryMin: 120, salaryMax: 200,
    bio: 'Versatile domestic worker with green fingers. Maintains both the home and garden beautifully. Known for her delicious traditional meals and thriving vegetable patches.',
  },
]

async function seedMaids() {
  console.log('👩‍🍳 Seeding additional maids (batch 2)...\n')

  for (const m of MAIDS) {
    const docRef = db.collection('workers').doc()

    const fullVerification = m.rating >= 4.7

    await docRef.set({
      firstName: m.firstName,
      lastName: m.lastName,
      displayName: m.displayName,
      slug: m.slug,
      category: 'Maid',
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
