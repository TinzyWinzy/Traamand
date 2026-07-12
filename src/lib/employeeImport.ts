/**
 * CSV Import Template Generator for Traamand HR Records
 * 
 * This script helps TRAAMAND HR migrate employee records from physical books,
 * Excel, or Word documents into the digital system.
 * 
 * Usage:
 *   1. Download the CSV template
 *   2. Fill in employee data from your physical records
 *   3. Upload via Admin > Workers > Import CSV
 *   4. System validates and creates worker records
 */

export interface EmployeeRecord {
  // Basic Information
  firstName: string
  lastName: string
  fullName?: string // Optional - if provided, splits into firstName/lastName
  phone: string
  age: number
  email?: string
  
  // Professional Information
  category: 'Maid' | 'Nanny' | 'Chef' | 'Gardener' | 'Nurse Aide' | 'Driver' | 'Sales Lady' | 'Bar Lady'
  yearsOfExperience: number
  skills: string // Comma-separated: "cleaning,laundry,cooking"
  previousEmployers: number
  
  // Service Details
  workType: 'live-in' | 'daily' | 'part-time' | 'temporary' // Preferred work arrangement
  preferredLocations: string // Comma-separated suburbs: "Borrowdale,Glen Lorne,Chisipite"
  monthlySalaryMin: number
  monthlySalaryMax: number
  placementFee: number
  
  // Vetting Information
  idVerified: 'yes' | 'no'
  policeClearance: 'yes' | 'no'
  referenceChecks: 'yes' | 'no'
  
  // Personal Information
  education: 'Primary' | 'Secondary (O-Level)' | 'Advanced (A-Level)' | 'Certificate / Diploma' | 'Degree'
  languages: string // Comma-separated: "Shona,English"
  nextOfKinContact: string
  
  // Availability
  status: 'available' | 'booked' | 'off' // Current availability
  notes?: string // Any additional notes from physical records
}

/**
 * CSV Template Header (copy this line to create your CSV):
 * 
 * firstName,lastName,phone,age,email,category,yearsOfExperience,skills,previousEmployers,workType,preferredLocations,monthlySalaryMin,monthlySalaryMax,placementFee,idVerified,policeClearance,referenceChecks,education,languages,nextOfKinContact,status,notes
 * 
 * EXAMPLE DATA (paste below the header):
 * 
 * Maria,Dube,0715325922,32,maria@email.com,Maid,8,"cleaning,laundry,cooking",5,daily,"Borrowdale,Chisipite",2000,3000,50,yes,yes,yes,Secondary (O-Level),Shona,0776123456,available,"Previously worked for family in Borrowdale"
 * John,Smith,0782329308,45,john@email.com,Driver,12,"driving,maintenance",8,daily,"Harare East",4000,5000,60,yes,yes,yes,Certificate / Diploma,English,0712456789,available,"Has PSV license"
 */

// Validation rules
export const VALIDATION_RULES = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    description: 'Employee first name'
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    description: 'Employee last name'
  },
  phone: {
    required: true,
    pattern: /^0[0-9]{9}$/,
    description: 'Zimbabwe phone number starting with 0 (10 digits)'
  },
  age: {
    required: true,
    minValue: 18,
    maxValue: 80,
    description: 'Must be at least 18 years old'
  },
  category: {
    required: true,
    enum: ['Maid', 'Nanny', 'Chef', 'Gardener', 'Nurse Aide', 'Driver', 'Sales Lady', 'Bar Lady'],
    description: 'Must be one of the supported categories'
  },
  yearsOfExperience: {
    required: true,
    minValue: 0,
    maxValue: 60,
    description: 'Years of experience in this role'
  },
  skills: {
    required: true,
    description: 'Comma-separated skills (e.g., "cleaning,laundry,cooking")'
  },
  education: {
    required: true,
    enum: ['Primary', 'Secondary (O-Level)', 'Advanced (A-Level)', 'Certificate / Diploma', 'Degree'],
    description: 'Highest level of education'
  },
  languages: {
    required: true,
    description: 'Comma-separated languages (e.g., "Shona,English")'
  },
  placementFee: {
    required: true,
    minValue: 0,
    description: 'Placement fee in ZWL'
  },
  idVerified: {
    required: true,
    enum: ['yes', 'no'],
    description: 'National ID verified status'
  },
  policeClearance: {
    required: true,
    enum: ['yes', 'no'],
    description: 'Police clearance obtained'
  }
}

export const CATEGORY_OPTIONS = [
  'Maid',
  'Nanny', 
  'Chef',
  'Gardener',
  'Nurse Aide',
  'Driver',
  'Sales Lady',
  'Bar Lady'
] as const

export const WORK_TYPE_OPTIONS = [
  'live-in',
  'daily',
  'part-time',
  'temporary'
] as const

export const EDUCATION_OPTIONS = [
  'Primary',
  'Secondary (O-Level)',
  'Advanced (A-Level)',
  'Certificate / Diploma',
  'Degree'
] as const

export const HARARE_SUBURBS = [
  'Borrowdale', 'Chisipite', 'Glen Lorne', 'Gunhill',
  'Greendale', 'Highlands', 'Newlands', 'Meyrick Park',
  'Mabelreign', 'Marlborough', 'Mt Pleasant', 'Avondale',
  'Hatfield', 'Kensington',
  'Belgravia', 'Eastlea'
] as const
