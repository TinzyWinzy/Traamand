/**
 * Firestore Seed Script for Traamand 2.0
 *
 * Run with: npx tsx scripts/seed/seed.ts
 * Requires a Firebase service account key at: scripts/seed/serviceAccount.json
 *
 * Seeds:
 * - 8 categories
 * - 20 workers across Harare suburbs
 * - 6 location pages
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccountPath = join(__dirname, 'serviceAccount.json')
let serviceAccount: Record<string, unknown>
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))
} catch {
  console.error('❌ serviceAccount.json not found at scripts/seed/serviceAccount.json')
  console.error('   Place your Firebase service account key there.')
  process.exit(1)
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  })
}

const db = getFirestore()
const ts = () => Timestamp.now()

const CATEGORIES = [
  { id: 'maids', name: 'Maid', slug: 'maids', description: 'Professional housekeepers for daily cleaning, deep cleaning, laundry, and household organization in Harare.', icon: 'Sparkles', sortOrder: 1, averagePlacementFee: 50, workerCount: 7 },
  { id: 'nannies', name: 'Nanny', slug: 'nannies', description: 'Experienced childcare providers — newborn care, toddler activities, early childhood education, CPR certified.', icon: 'Baby', sortOrder: 2, averagePlacementFee: 55, workerCount: 4 },
  { id: 'chefs', name: 'Chef', slug: 'chefs', description: 'Trained chefs for home cooking, meal planning, baking, dietary meals, and event catering.', icon: 'ChefHat', sortOrder: 3, averagePlacementFee: 60, workerCount: 3 },
  { id: 'gardeners', name: 'Gardener', slug: 'gardeners', description: 'Skilled gardeners for lawn maintenance, landscaping, vegetable gardens, irrigation, and pest control.', icon: 'Trees', sortOrder: 4, averagePlacementFee: 45, workerCount: 2 },
  { id: 'nurse-aides', name: 'Nurse Aide', slug: 'nurse-aides', description: 'Compassionate nurse aides for elderly care, medication reminders, mobility support, and patient hygiene.', icon: 'Heart', sortOrder: 5, averagePlacementFee: 55, workerCount: 2 },
  { id: 'drivers', name: 'Driver', slug: 'drivers', description: 'Professional drivers — school runs, CEO chauffeur, fleet management, defensive driving certified.', icon: 'Car', sortOrder: 6, averagePlacementFee: 60, workerCount: 2 },
  { id: 'sales-ladies', name: 'Sales Lady', slug: 'sales-ladies', description: 'Retail and customer service professionals — cash handling, inventory management, merchandising.', icon: 'ShoppingBag', sortOrder: 7, averagePlacementFee: 40, workerCount: 0 },
  { id: 'bar-ladies', name: 'Bar Lady', slug: 'bar-ladies', description: 'Experienced bartenders — mixology, event service, stock control, cash management.', icon: 'Wine', sortOrder: 8, averagePlacementFee: 40, workerCount: 0 },
]

const WORKERS = [
  {
    firstName: 'Maria', lastName: 'Kachidza', displayName: 'Maria K.', slug: 'maria-k-harare-maid',
    category: 'Maid', experienceYears: 5, skills: ['cleaning', 'laundry', 'meal-preparation'],
    languages: ['Shona', 'English'], preferredLocations: ['Avondale', 'Mt Pleasant', 'Marlborough'],
    workType: ['live-in', 'daily'], rating: 4.9, reviewCount: 47, hireCount: 47,
    placementFee: 50, salaryRange: [120, 200], bio: 'Professional maid with 5 years of experience in high-end Harare homes. Specializes in deep cleaning, laundry care, and meal preparation. Trusted by families in Avondale and Mt Pleasant.',
  },
  {
    firstName: 'Grace', lastName: 'Tawengwa', displayName: 'Grace T.', slug: 'grace-t-harare-maid',
    category: 'Maid', experienceYears: 3, skills: ['cleaning', 'childcare', 'elderly-care'],
    languages: ['Shona', 'English'], preferredLocations: ['Borrowdale', 'Chisipite', 'Glen Lorne'],
    workType: ['live-in', 'daily', 'temporary'], rating: 4.7, reviewCount: 23, hireCount: 23,
    placementFee: 50, salaryRange: [100, 180], bio: 'Reliable and caring maid with a gentle touch. Experience with children and elderly care alongside full housekeeping duties.',
  },
  {
    firstName: 'Ruth', lastName: 'Moyo', displayName: 'Ruth M.', slug: 'ruth-m-harare-maid',
    category: 'Maid', experienceYears: 7, skills: ['cleaning', 'laundry', 'pet-care', 'organization'],
    languages: ['Shona', 'English', 'Ndebele'], preferredLocations: ['Greendale', 'Highlands', 'Newlands'],
    workType: ['live-in', 'daily', 'part-time'], rating: 4.8, reviewCount: 34, hireCount: 34,
    placementFee: 50, salaryRange: [130, 220], bio: 'Highly organized domestic professional. Known for transforming chaotic homes into immaculate spaces. Pet friendly and excellent with families.',
  },
  {
    firstName: 'Chiedza', lastName: 'Makoni', displayName: 'Chiedza M.', slug: 'chiedza-m-harare-maid',
    category: 'Maid', experienceYears: 4, skills: ['cleaning', 'gardening', 'meal-preparation'],
    languages: ['Shona'], preferredLocations: ['Hatfield', 'Kensington', 'Eastlea'],
    workType: ['live-in', 'daily'], rating: 4.5, reviewCount: 12, hireCount: 12,
    placementFee: 45, salaryRange: [90, 150], bio: 'Hardworking maid with a passion for gardening on the side. Full housekeeping plus vegetable garden maintenance.',
  },
  {
    firstName: 'Tendai', lastName: 'Nyoni', displayName: 'Tendai N.', slug: 'tendai-n-harare-maid',
    category: 'Maid', experienceYears: 6, skills: ['cleaning', 'laundry', 'childcare'],
    languages: ['Shona', 'English'], preferredLocations: ['Belgravia', 'Eastlea', 'Meyrick Park'],
    workType: ['live-in', 'daily'], rating: 4.6, reviewCount: 19, hireCount: 19,
    placementFee: 50, salaryRange: [110, 190], bio: 'Experienced domestic worker with childcare expertise. CPR certified. Excellent references from Harare Central families.',
  },
  {
    firstName: 'Primrose', lastName: 'Chigumba', displayName: 'Primrose C.', slug: 'primrose-c-harare-maid',
    category: 'Maid', experienceYears: 10, skills: ['cleaning', 'laundry', 'elderly-care', 'cooking'],
    languages: ['Shona', 'English'], preferredLocations: ['Avondale', 'Mabelreign', 'Marlborough'],
    workType: ['live-in', 'daily'], rating: 5.0, reviewCount: 68, hireCount: 68,
    placementFee: 60, salaryRange: [150, 250], bio: 'Award-winning domestic professional with a flawless track record. Specializes in elderly companion care alongside full housekeeping. 68 families served.',
  },
  {
    firstName: 'Sharon', lastName: 'Dube', displayName: 'Sharon D.', slug: 'sharon-d-harare-maid',
    category: 'Maid', experienceYears: 2, skills: ['cleaning', 'laundry', 'pet-care'],
    languages: ['Ndebele', 'English'], preferredLocations: ['Borrowdale', 'Gunhill', 'Mt Pleasant'],
    workType: ['live-in', 'daily', 'temporary'], rating: 4.3, reviewCount: 8, hireCount: 8,
    placementFee: 40, salaryRange: [80, 140], bio: 'Enthusiastic young domestic worker. Strong work ethic, quick learner, and great with dogs. Available for immediate start.',
  },
  {
    firstName: 'Tsitsi', lastName: 'Marechera', displayName: 'Tsitsi M.', slug: 'tsitsi-m-harare-nanny',
    category: 'Nanny', experienceYears: 6, skills: ['newborn-care', 'first-aid', 'early-childhood-education', 'cpr'],
    languages: ['Shona', 'English'], preferredLocations: ['Borrowdale', 'Chisipite', 'Glen Lorne'],
    workType: ['live-in', 'daily'], rating: 4.9, reviewCount: 31, hireCount: 31,
    placementFee: 55, salaryRange: [130, 220], bio: 'Certified nanny with Montessori training. Specializes in newborn through preschool care. CPR and First Aid certified. Trusted by expatriate families in Borrowdale.',
  },
  {
    firstName: 'Linda', lastName: 'Sibanda', displayName: 'Linda S.', slug: 'linda-s-harare-nanny',
    category: 'Nanny', experienceYears: 3, skills: ['infant-care', 'toddler-activities', 'feeding', 'light-housekeeping'],
    languages: ['Ndebele', 'English'], preferredLocations: ['Avondale', 'Mt Pleasant', 'Gunhill'],
    workType: ['live-in', 'daily', 'part-time'], rating: 4.6, reviewCount: 14, hireCount: 14,
    placementFee: 50, salaryRange: [100, 170], bio: 'Warm and creative nanny who makes learning fun. Experience with infants and toddlers. English and Ndebele speaking.',
  },
  {
    firstName: 'Ruvimbo', lastName: 'Mazowe', displayName: 'Ruvimbo M.', slug: 'ruvimbo-m-harare-nanny',
    category: 'Nanny', experienceYears: 8, skills: ['newborn-care', 'twins', 'sleep-training', 'weaning'],
    languages: ['Shona', 'English'], preferredLocations: ['Greendale', 'Highlands', 'Newlands'],
    workType: ['live-in', 'daily'], rating: 5.0, reviewCount: 42, hireCount: 42,
    placementFee: 60, salaryRange: [150, 250], bio: 'Expert nanny with twin and newborn specialization. Trained in sleep training and weaning. 42 families recommend her. Available for live-in positions.',
  },
  {
    firstName: 'Memory', lastName: 'Chimutengwende', displayName: 'Memory C.', slug: 'memory-c-harare-nanny',
    category: 'Nanny', experienceYears: 4, skills: ['toddler-activities', 'feeding', 'early-education', 'cpr'],
    languages: ['Shona', 'English'], preferredLocations: ['Hatfield', 'Kensington', 'Belgravia'],
    workType: ['live-in', 'daily', 'part-time'], rating: 4.5, reviewCount: 11, hireCount: 11,
    placementFee: 50, salaryRange: [100, 180], bio: 'Patient and nurturing nanny with a gift for early childhood education. Helps toddlers reach developmental milestones through play-based learning.',
  },
  {
    firstName: 'Michael', lastName: 'Chari', displayName: 'Michael C.', slug: 'michael-c-harare-chef',
    category: 'Chef', experienceYears: 8, skills: ['cooking', 'baking', 'menu-planning', 'dietary-meals'],
    languages: ['Shona', 'English'], preferredLocations: ['Avondale', 'Mt Pleasant', 'Borrowdale'],
    workType: ['live-in', 'daily'], rating: 4.8, reviewCount: 29, hireCount: 29,
    placementFee: 65, salaryRange: [180, 300], bio: 'Hotel-trained chef with 8 years in private households. Specializes in international cuisine, dietary meals (diabetic, gluten-free), and gourmet baking. Previously served diplomatic residences.',
  },
  {
    firstName: 'Patrick', lastName: 'Ndlovu', displayName: 'Patrick N.', slug: 'patrick-n-harare-chef',
    category: 'Chef', experienceYears: 5, skills: ['cooking', 'pastry', 'grilling', 'event-catering'],
    languages: ['Ndebele', 'English'], preferredLocations: ['Belgravia', 'Eastlea', 'Meyrick Park'],
    workType: ['daily', 'part-time', 'temporary'], rating: 4.6, reviewCount: 18, hireCount: 18,
    placementFee: 55, salaryRange: [150, 250], bio: 'Creative chef with a passion for fusion cuisine. Available for daily meal prep, dinner parties, and event catering. Known for his legendary braai and pastry skills.',
  },
  {
    firstName: 'Patience', lastName: 'Gumbo', displayName: 'Patience G.', slug: 'patience-g-harare-chef',
    category: 'Chef', experienceYears: 7, skills: ['cooking', 'baking', 'traditional-cuisine', 'menu-planning'],
    languages: ['Shona', 'English'], preferredLocations: ['Greendale', 'Highlands', 'Chisipite'],
    workType: ['live-in', 'daily'], rating: 4.7, reviewCount: 22, hireCount: 22,
    placementFee: 60, salaryRange: [160, 280], bio: 'Traditional and modern cuisine specialist. Masters both sadza-based traditional meals and international dishes. Available for live-in positions in Harare East.',
  },
  {
    firstName: 'John', lastName: 'Mukanya', displayName: 'John M.', slug: 'john-m-harare-gardener',
    category: 'Gardener', experienceYears: 12, skills: ['lawn-maintenance', 'irrigation', 'hedge-trimming', 'landscaping', 'pest-control'],
    languages: ['Shona', 'English'], preferredLocations: ['Borrowdale', 'Glen Lorne', 'Chisipite'],
    workType: ['daily', 'part-time'], rating: 4.9, reviewCount: 41, hireCount: 41,
    placementFee: 45, salaryRange: [130, 220], bio: 'Master gardener with 12 years transforming Harare North gardens. Expert in irrigation systems, hedge design, organic pest control, and vegetable gardens.',
  },
  {
    firstName: 'Taurai', lastName: 'Zhou', displayName: 'Taurai Z.', slug: 'taurai-z-harare-gardener',
    category: 'Gardener', experienceYears: 5, skills: ['vegetable-gardening', 'pruning', 'lawn-maintenance', 'composting'],
    languages: ['Shona'], preferredLocations: ['Greendale', 'Mabelreign', 'Avondale'],
    workType: ['daily', 'part-time', 'temporary'], rating: 4.4, reviewCount: 10, hireCount: 10,
    placementFee: 40, salaryRange: [90, 160], bio: 'Passionate organic gardener specializing in vegetable and herb gardens. Provides composting training and sustainable garden practices.',
  },
  {
    firstName: 'Sekai', lastName: 'Chingono', displayName: 'Sekai C.', slug: 'sekai-c-harare-nurse-aide',
    category: 'Nurse Aide', experienceYears: 8, skills: ['elderly-care', 'medication-reminders', 'mobility-support', 'first-aid', 'patient-hygiene'],
    languages: ['Shona', 'English'], preferredLocations: ['Avondale', 'Mt Pleasant', 'Borrowdale'],
    workType: ['live-in', 'daily'], rating: 4.9, reviewCount: 36, hireCount: 36,
    placementFee: 55, salaryRange: [140, 240], bio: 'Compassionate nurse aide with specialist elderly care training. Medication management, mobility assistance, companionship. Families in Avondale and Mt Pleasant trust her with their loved ones.',
  },
  {
    firstName: 'Chipo', lastName: 'Mutasa', displayName: 'Chipo M.', slug: 'chipo-m-harare-nurse-aide',
    category: 'Nurse Aide', experienceYears: 4, skills: ['bedside-care', 'vital-signs', 'patient-hygiene', 'wound-care'],
    languages: ['Shona', 'English'], preferredLocations: ['Belgravia', 'Eastlea', 'Highlands'],
    workType: ['live-in', 'daily', 'temporary'], rating: 4.6, reviewCount: 15, hireCount: 15,
    placementFee: 50, salaryRange: [120, 200], bio: 'Trained nurse aide with hospital and home care experience. Skilled in vital signs monitoring, wound care, and post-surgery recovery support.',
  },
  {
    firstName: 'Tinashe', lastName: 'Murefu', displayName: 'Tinashe M.', slug: 'tinashe-m-harare-driver',
    category: 'Driver', experienceYears: 10, skills: ['defensive-driving', 'vehicle-maintenance', 'route-planning', 'school-runs'],
    languages: ['Shona', 'English'], preferredLocations: ['Borrowdale', 'Chisipite', 'Glen Lorne'],
    workType: ['daily', 'part-time'], rating: 4.8, reviewCount: 28, hireCount: 28,
    placementFee: 60, salaryRange: [150, 250], bio: 'Professional driver with clean record and 10 years experience. Defensive driving certified. Expert in school runs, executive chauffeur duties, and Harare route navigation.',
  },
  {
    firstName: 'Farai', lastName: 'Mushonga', displayName: 'Farai M.', slug: 'farai-m-harare-driver',
    category: 'Driver', experienceYears: 6, skills: ['school-runs', 'fleet-management', 'route-planning', 'vehicle-maintenance'],
    languages: ['Shona', 'English', 'Ndebele'], preferredLocations: ['Avondale', 'Mt Pleasant', 'Mabelreign'],
    workType: ['daily', 'part-time', 'temporary'], rating: 4.5, reviewCount: 13, hireCount: 13,
    placementFee: 55, salaryRange: [130, 220], bio: 'Reliable driver available for school runs, airport transfers, and corporate shuttle services. Owns a clean, well-maintained vehicle. Knowledgeable of all Harare and surrounding routes.',
  },
]

const LOCATION_PAGES = [
  {
    id: 'harare-avondale-maids', city: 'Harare', suburb: 'Avondale', serviceType: 'Maid',
    metaTitle: 'Hire Verified Maids in Avondale, Harare | Traamand',
    metaDescription: 'Looking for a trusted maid in Avondale, Harare? Browse Divine Seal verified maids. Background-screened, video-interviewed. Book in 3 taps.',
    h1: 'Verified Maids in Avondale, Harare',
    content: 'Avondale is one of Harare\'s most established residential areas. Traamand connects Avondale households with document-verified, background-screened maids who understand the standards expected in Avondale homes. Every maid on this page has passed our Divine Seal verification — National ID, Police Clearance, and reference checks.',
    landmarks: ['Avondale Shopping Centre', 'Avondale Primary School', 'King George Road'],
    availableWorkerCount: 3, averageRating: 4.8, recentHires: 12,
  },
  {
    id: 'harare-borrowdale-maids', city: 'Harare', suburb: 'Borrowdale', serviceType: 'Maid',
    metaTitle: 'Hire Verified Maids in Borrowdale, Harare | Traamand',
    metaDescription: 'Premium maids available in Borrowdale, Harare. Divine Seal verified domestic workers. Quick booking, instant confirmation.',
    h1: 'Verified Maids in Borrowdale, Harare',
    content: 'Borrowdale is Harare\'s premier residential suburb. Our Borrowdale maids are selected for their experience in large homes, high standards of cleanliness, and discretion. Every candidate undergoes full Divine Seal verification before being listed.',
    landmarks: ['Borrowdale Village', 'Sam Levy\'s Village', 'Borrowdale Road'],
    availableWorkerCount: 4, averageRating: 4.7, recentHires: 18,
  },
  {
    id: 'harare-mt-pleasant-maids', city: 'Harare', suburb: 'Mt Pleasant', serviceType: 'Maid',
    metaTitle: 'Hire Verified Maids in Mt Pleasant, Harare | Traamand',
    metaDescription: 'Vetted maids available in Mt Pleasant, Harare. Police cleared, reference checked. Book your domestic worker today.',
    h1: 'Verified Maids in Mt Pleasant, Harare',
    content: 'Mt Pleasant is a vibrant Harare suburb home to families, professionals, and the University of Zimbabwe. Traamand serves Mt Pleasant with verified maids who can handle the unique needs of this diverse community.',
    landmarks: ['University of Zimbabwe', 'Mt Pleasant Shopping Centre', 'Alpes Road'],
    availableWorkerCount: 2, averageRating: 4.6, recentHires: 8,
  },
  {
    id: 'harare-greendale-maids', city: 'Harare', suburb: 'Greendale', serviceType: 'Maid',
    metaTitle: 'Hire Verified Maids in Greendale, Harare | Traamand',
    metaDescription: 'Background-screened maids in Greendale, Harare. Divine Seal guarantee. Fast booking in under 3 minutes.',
    h1: 'Verified Maids in Greendale, Harare',
    content: 'Greendale is one of Harare East\'s most sought-after residential suburbs. Our Greendale maids are experienced in family homes, familiar with the area, and fully verified through our Divine Seal process.',
    landmarks: ['Greendale Shopping Centre', 'Greendale Avenue', 'Harare Drive'],
    availableWorkerCount: 2, averageRating: 4.5, recentHires: 6,
  },
  {
    id: 'harare-borrowdale-nannies', city: 'Harare', suburb: 'Borrowdale', serviceType: 'Nanny',
    metaTitle: 'Hire Verified Nannies in Borrowdale, Harare | Traamand',
    metaDescription: 'CPR-certified, reference-checked nannies in Borrowdale. Newborn care, toddler specialists. Divine Seal verified.',
    h1: 'Verified Nannies in Borrowdale, Harare',
    content: 'Borrowdale families demand the best childcare. Our nannies are CPR certified, Montessori trained where applicable, and fully Divine Seal verified. Every nanny profile includes a video introduction.',
    landmarks: ['Borrowdale Village', 'Sam Levy\'s Village', 'Borrowdale Primary School'],
    availableWorkerCount: 2, averageRating: 4.8, recentHires: 10,
  },
  {
    id: 'harare-avondale-nurse-aides', city: 'Harare', suburb: 'Avondale', serviceType: 'Nurse Aide',
    metaTitle: 'Hire Verified Nurse Aides in Avondale, Harare | Traamand',
    metaDescription: 'Compassionate nurse aides for elderly care in Avondale. Medication management, mobility support. Divine Seal verified.',
    h1: 'Verified Nurse Aides in Avondale, Harare',
    content: 'Avondale has a significant elderly population that deserves quality care at home. Our nurse aides are trained in medication management, mobility assistance, and compassionate companionship.',
    landmarks: ['Avondale Shopping Centre', 'Arundel Village', 'Avondale Medical Centre'],
    availableWorkerCount: 2, averageRating: 4.8, recentHires: 8,
  },
]

async function seed() {
  console.log('🌱 Seeding Traamand Firestore database...\n')

  console.log('📂 Seeding categories...')
  for (const cat of CATEGORIES) {
    await db.collection('categories').doc(cat.id).set({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      heroImage: '',
      metaTitle: `Hire ${cat.name}s in Harare, Zimbabwe | Traamand`,
      metaDescription: `Browse verified ${cat.name.toLowerCase()}s in Harare. Background-screened, document-verified, available now. Divine Seal guarantee.`,
      averagePlacementFee: cat.averagePlacementFee,
      workerCount: cat.workerCount,
      sortOrder: cat.sortOrder,
      updatedAt: ts(),
    })
    console.log(`  ✅ ${cat.name}`)
  }

  console.log('\n👷 Seeding workers...')
  for (const w of WORKERS) {
    const fullVerification = w.rating >= 4.7
    const docRef = db.collection('workers').doc()

    await docRef.set({
      firstName: w.firstName,
      lastName: w.lastName,
      displayName: w.displayName,
      slug: w.slug,
      verificationStatus: w.rating >= 4.8 ? 'premium' : 'verified',
      divineSeal: {
        idVerified: true,
        policeClearance: fullVerification,
        referenceVideoUrl: '',
        medicalClearance: w.rating >= 4.8,
        trainingCompleted: w.rating >= 4.6,
        verifiedAt: ts(),
        verifiedBy: 'admin',
      },
      photos: [],
      bio: w.bio,
      languages: w.languages,
      skills: w.skills,
      experienceYears: w.experienceYears,
      previousEmployers: Math.floor(w.hireCount * 0.7),
      availability: {
        status: 'available',
        nextAvailable: null,
        preferredLocations: w.preferredLocations,
        workType: w.workType,
      },
      rating: w.rating,
      reviewCount: w.reviewCount,
      recentReviews: [],
      hireCount: w.hireCount,
      lastHiredAt: ts(),
      placementFee: w.placementFee,
      monthlySalaryRange: { min: w.salaryRange[0], max: w.salaryRange[1] },
      metaTitle: `${w.displayName} - Verified ${w.category} in Harare | Traamand`,
      metaDescription: `${w.displayName} is a Divine Seal verified ${w.category.toLowerCase()} in Harare with ${w.experienceYears} years experience. ${w.rating}-star rating from ${w.reviewCount} reviews. Book now.`,
      serviceAreas: w.preferredLocations,
      isActive: true,
      createdAt: ts(),
      updatedAt: ts(),
    })
    console.log(`  ✅ ${w.displayName} (${w.category})`)
  }

  console.log('\n📍 Seeding location pages...')
  for (const lp of LOCATION_PAGES) {
    await db.collection('locationPages').doc(lp.id).set({
      ...lp,
      topWorkers: [],
      structuredData: {},
      recentHires: lp.recentHires,
      updatedAt: ts(),
    })
    console.log(`  ✅ ${lp.id}`)
  }

  console.log('\n🎉 Seed complete!')
  console.log(`   • ${CATEGORIES.length} categories`)
  console.log(`   • ${WORKERS.length} workers`)
  console.log(`   • ${LOCATION_PAGES.length} location pages`)
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
