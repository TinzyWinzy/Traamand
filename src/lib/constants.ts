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
  { label: "Find a Maid", to: "/find-a-maid" },
  { label: "Join Our Team", to: "/join-our-team" },
] as const

export const HARARE_SUBURBS = [
  "Borrowdale", "Chisipite", "Greendale", "Glen Lorne",
  "Gunhill", "Highlands", "Mabelreign", "Marlborough",
  "Mt Pleasant", "Newlands", "Avondale", "Belgravia",
  "Eastlea", "Hatfield", "Kensington", "Meyrick Park",
]

export const SERVICE_TYPES = [
  { label: "Full-Time Live-In Maid", desc: "Round-the-clock household care" },
  { label: "Part-Time Housekeeper", desc: "Flexible help by the hour or day" },
  { label: "Childminder & Nanny", desc: "Childcare, feeding & early education" },
  { label: "Vetted & Ready-to-Work Staff", desc: "Pre-screened, available immediately" },
]

export const HOUSE_SIZES = [
  "1-2 bedroom",
  "3 bedroom",
  "4 bedroom",
  "5+ bedroom",
]

export const EXPERIENCE_LEVELS = [
  "Less than 1 year",
  "1-2 years",
  "3-5 years",
  "5+ years",
]
