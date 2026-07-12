export const COMPANY_NAME = "Traamand Employment Services"
export const COMPANY_SHORT = "Traamand"

export const ADDRESS = "Corner Jaison Mbuya Nehanda Street & Central Avenue, Azhari Building, Room 4A, Harare, Zimbabwe"

export const PHONE_NUMBERS = [
  "+263 715 325 922",
  "+263 782 329 308",
  "+263 777 566 584",
  "+263 711 689 989",
] as const

export const PRIMARY_PHONE = PHONE_NUMBERS[0]
export const EMAIL = "tmandovha@gmail.com"

export const WHATSAPP_NUMBER = PHONE_NUMBERS[0]
export const WHATSAPP_MESSAGE = "Hello! I'm interested in your domestic worker placement services."

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Available Staff", to: "/available-staff" },
  { label: "Find a Maid", to: "/find-a-maid" },
  { label: "Join Our Team", to: "/join-our-team" },
  { label: "Earn Money", to: "/my-referrals" },
] as const

export const SUBURBS_BY_REGION: Record<string, string[]> = {
  "Harare North": ["Borrowdale", "Chisipite", "Glen Lorne", "Gunhill"],
  "Harare East": ["Greendale", "Highlands", "Newlands", "Meyrick Park"],
  "Harare West": ["Mabelreign", "Marlborough", "Mt Pleasant", "Avondale"],
  "Harare South": ["Hatfield", "Kensington"],
  "Harare Central": ["Belgravia", "Eastlea"],
} as const

export const SERVICE_TYPES = [
  { label: "Full-Time Live-In", desc: "Round-the-clock household care" },
  { label: "Part-Time", desc: "Flexible help by the hour or day" },
  { label: "Nanny/Childminder", desc: "Childcare, feeding & early education" },
  { label: "Corporate Cleaner", desc: "Office & commercial cleaning" },
]

export const EDUCATION_LEVELS = [
  "Primary",
  "Secondary (O-Level)",
  "Advanced (A-Level)",
  "Certificate / Diploma",
  "Degree",
]

export const LANGUAGES = ["Shona", "Ndebele", "English", "Other"]

export const SERVICE_CATEGORIES = [
  "Maid", "Nanny", "Chef", "Gardener", "Nurse Aide", "Driver", "Sales Lady", "Bar Lady",
] as const

export interface CategoryMeta {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  sortOrder: number
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'maids', name: 'Maid', slug: 'maids', description: 'Housekeeping, cleaning & laundry', icon: 'Sparkles', sortOrder: 1 },
  { id: 'nannies', name: 'Nanny', slug: 'nannies', description: 'Childcare, newborn care & tutoring', icon: 'Baby', sortOrder: 2 },
  { id: 'chefs', name: 'Chef', slug: 'chefs', description: 'Cooking, baking & meal planning', icon: 'ChefHat', sortOrder: 3 },
  { id: 'gardeners', name: 'Gardener', slug: 'gardeners', description: 'Lawn care, landscaping & pruning', icon: 'Trees', sortOrder: 4 },
  { id: 'nurse-aides', name: 'Nurse Aide', slug: 'nurse-aides', description: 'Elderly care, medication & mobility support', icon: 'Heart', sortOrder: 5 },
  { id: 'drivers', name: 'Driver', slug: 'drivers', description: 'Chauffeur, school runs & fleet management', icon: 'Car', sortOrder: 6 },
  { id: 'sales-ladies', name: 'Sales Lady', slug: 'sales-ladies', description: 'Retail, customer service & merchandising', icon: 'ShoppingBag', sortOrder: 7 },
  { id: 'bar-ladies', name: 'Bar Lady', slug: 'bar-ladies', description: 'Bartending, mixology & event service', icon: 'Wine', sortOrder: 8 },
]

export interface Candidate {
  id: string
  category: "Nanny" | "Maid" | "Chef" | "Gardener" | "Nurse Aide" | "Driver" | "Sales Lady" | "Bar Lady"
  experienceYears: number
  skills: string[]
  preferredLocation: string
  vetting: {
    nationalIdVerified: boolean
    policeClearanceSighted: boolean
    referenceChecksCompleted: boolean
  }
}

export const CANDIDATES: Candidate[] = [
  {
    id: "TM-001",
    category: "Nanny",
    experienceYears: 6,
    skills: ["Newborn Care", "First Aid", "Early Childhood Education"],
    preferredLocation: "Harare North",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-002",
    category: "Maid",
    experienceYears: 4,
    skills: ["Deep Cleaning", "Laundry", "Meal Preparation"],
    preferredLocation: "Harare East",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-003",
    category: "Chef",
    experienceYears: 8,
    skills: ["Cooking", "Baking", "Menu Planning"],
    preferredLocation: "Harare Central",
    vetting: { nationalIdVerified: true, policeClearanceSighted: false, referenceChecksCompleted: true },
  },
  {
    id: "TM-004",
    category: "Nanny",
    experienceYears: 3,
    skills: ["Infant Care", "Toddler Activities", "CPR Certified"],
    preferredLocation: "Harare West",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-005",
    category: "Maid",
    experienceYears: 7,
    skills: ["Elderly Care", "Housekeeping", "Gardening"],
    preferredLocation: "Harare South",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: false },
  },
  {
    id: "TM-006",
    category: "Chef",
    experienceYears: 5,
    skills: ["Pastry", "Grilling", "Dietary Meals"],
    preferredLocation: "Harare East",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-007",
    category: "Nanny",
    experienceYears: 2,
    skills: ["Newborn Care", "Light Housekeeping"],
    preferredLocation: "Harare North",
    vetting: { nationalIdVerified: false, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-008",
    category: "Maid",
    experienceYears: 10,
    skills: ["Deep Cleaning", "Pet Care", "Organization"],
    preferredLocation: "Harare West",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-009",
    category: "Gardener",
    experienceYears: 7,
    skills: ["Lawn Maintenance", "Irrigation", "Hedge Trimming", "Pest Control"],
    preferredLocation: "Harare North",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-010",
    category: "Gardener",
    experienceYears: 4,
    skills: ["Vegetable Gardening", "Landscaping", "Pruning"],
    preferredLocation: "Harare East",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: false },
  },
  {
    id: "TM-011",
    category: "Nurse Aide",
    experienceYears: 6,
    skills: ["Elderly Care", "Medication Reminders", "Mobility Support", "First Aid"],
    preferredLocation: "Harare Central",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-012",
    category: "Nurse Aide",
    experienceYears: 3,
    skills: ["Bedside Care", "Vital Signs", "Patient Hygiene"],
    preferredLocation: "Harare West",
    vetting: { nationalIdVerified: true, policeClearanceSighted: false, referenceChecksCompleted: true },
  },
  {
    id: "TM-013",
    category: "Driver",
    experienceYears: 12,
    skills: ["Defensive Driving", "Vehicle Maintenance", "Route Planning"],
    preferredLocation: "Harare South",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-014",
    category: "Driver",
    experienceYears: 8,
    skills: ["School Runs", "CEO Chauffeur", "Fleet Management"],
    preferredLocation: "Harare North",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-015",
    category: "Sales Lady",
    experienceYears: 5,
    skills: ["Customer Service", "Cash Handling", "Inventory Management"],
    preferredLocation: "Harare East",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-016",
    category: "Sales Lady",
    experienceYears: 3,
    skills: ["Retail Sales", "Merchandising", "POS Systems"],
    preferredLocation: "Harare Central",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-017",
    category: "Bar Lady",
    experienceYears: 4,
    skills: ["Mixology", "Customer Service", "Stock Control"],
    preferredLocation: "Harare West",
    vetting: { nationalIdVerified: true, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
  {
    id: "TM-018",
    category: "Bar Lady",
    experienceYears: 6,
    skills: ["Bartending", "Event Service", "Cash Management"],
    preferredLocation: "Harare South",
    vetting: { nationalIdVerified: false, policeClearanceSighted: true, referenceChecksCompleted: true },
  },
]

export const WHATSAPP_NUMBERS = [
  { number: "+263 715 325 922", badge: "Client Bookings Support" },
  { number: "+263 782 329 308", badge: "Job Applications Support" },
  { number: "+263 777 566 584", badge: "General Inquiries" },
] as const
