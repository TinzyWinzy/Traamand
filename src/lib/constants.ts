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

export const HOUSE_CLEANING_ACTIVITIES = [
  "General house cleaning",
  "Deep cleaning",
  "Spring cleaning",
  "Move-in and move-out cleaning",
  "Kitchen cleaning",
  "Bathroom cleaning",
  "Floor sweeping and mopping",
  "Dusting furniture and surfaces",
  "Laundry washing",
  "Ironing",
  "Bed making and linen changing",
  "Wardrobe organizing",
  "Cupboard and pantry organizing",
  "Dishwashing",
  "Trash removal",
  "Window cleaning",
  "Post-renovation cleaning",
  "After-party cleaning",
  "Office cleaning",
  "Airbnb and guest house turnover cleaning",
] as const

export const EMPLOYMENT_AGENT_SERVICES = [
  "High-quality, carefully selected maids",
  "Gardeners for lawn care and landscaping",
  "Nurse aides for elderly and patient support",
  "Drivers for school runs, errands, and chauffeur work",
  "Nannies, chefs, sales ladies, and bar ladies",
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
  { id: 'maids', name: 'Maid', slug: 'maids', description: 'House cleaning, deep cleaning, laundry & ironing', icon: 'Sparkles', sortOrder: 1 },
  { id: 'nannies', name: 'Nanny', slug: 'nannies', description: 'Childcare, newborn care & tutoring', icon: 'Baby', sortOrder: 2 },
  { id: 'chefs', name: 'Chef', slug: 'chefs', description: 'Cooking, baking & meal planning', icon: 'ChefHat', sortOrder: 3 },
  { id: 'gardeners', name: 'Gardener', slug: 'gardeners', description: 'Lawn care, landscaping & pruning', icon: 'Trees', sortOrder: 4 },
  { id: 'nurse-aides', name: 'Nurse Aide', slug: 'nurse-aides', description: 'Elderly care, medication & mobility support', icon: 'Heart', sortOrder: 5 },
  { id: 'drivers', name: 'Driver', slug: 'drivers', description: 'Chauffeur, school runs & fleet management', icon: 'Car', sortOrder: 6 },
  { id: 'sales-ladies', name: 'Sales Lady', slug: 'sales-ladies', description: 'Retail, customer service & merchandising', icon: 'ShoppingBag', sortOrder: 7 },
  { id: 'bar-ladies', name: 'Bar Lady', slug: 'bar-ladies', description: 'Bartending, mixology & event service', icon: 'Wine', sortOrder: 8 },
]

export const PLATFORM_CONFIG = {
  radbitStudioFeePercent: 0.15,
  traamandRevenuePercent: 0.85,
  payoutFeePercent: 0.02,
  paynowPayoutMethod: 'ecocash',
} as const

export const WHATSAPP_NUMBERS = [
  { number: "+263 715 325 922", badge: "Client Bookings Support" },
  { number: "+263 782 329 308", badge: "Job Applications Support" },
  { number: "+263 777 566 584", badge: "General Inquiries" },
] as const
