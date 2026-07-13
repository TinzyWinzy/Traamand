import type { Timestamp } from 'firebase/firestore'

export type WorkerVerificationStatus = 'pending' | 'verified' | 'premium'
export type AvailabilityStatus = 'available' | 'booked' | 'off'
export type WorkType = 'live-in' | 'daily' | 'part-time' | 'temporary'
export type BookingStatus =
  | 'inquiry'
  | 'matched'
  | 'booked'
  | 'placement_fee_paid'
  | 'worker_assigned'
  | 'started'
  | 'completed'
  | 'cancelled'

export type ServiceCategory =
  | 'Maid'
  | 'Nanny'
  | 'Chef'
  | 'Gardener'
  | 'Nurse Aide'
  | 'Driver'
  | 'Sales Lady'
  | 'Bar Lady'

export interface DivineSeal {
  idVerified: boolean
  policeClearance: boolean
  referenceVideoUrl: string
  medicalClearance: boolean
  trainingCompleted: boolean
  verifiedAt: Timestamp | null
  verifiedBy: string
}

export interface WorkerAvailability {
  status: AvailabilityStatus
  nextAvailable: Timestamp | null
  preferredLocations: string[]
  workType: WorkType[]
}

export interface Review {
  author: string
  rating: number
  text: string
  date: Timestamp
  location: string
}

export interface Worker {
  id: string
  firstName: string
  lastName: string
  displayName: string
  slug: string
  category: string
  verificationStatus: WorkerVerificationStatus
  divineSeal: DivineSeal
  photos: string[]
  bio: string
  languages: string[]
  skills: string[]
  experienceYears: number
  previousEmployers: number
  availability: WorkerAvailability
  rating: number
  reviewCount: number
  recentReviews: Review[]
  hireCount: number
  lastHiredAt: Timestamp | null
  placementFee: number
  monthlySalaryRange: {
    min: number
    max: number
  }
  metaTitle: string
  metaDescription: string
  serviceAreas: string[]
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Category {
  id: string
  name: ServiceCategory
  slug: string
  description: string
  icon: string
  heroImage: string
  metaTitle: string
  metaDescription: string
  averagePlacementFee: number
  workerCount: number
  sortOrder: number
}

export interface ClientAddress {
  street: string
  suburb: string
  city: string
  lat: number
  lng: number
}

export interface BookingRequirements {
  cooking: boolean
  childcare: boolean
  elderlyCare: boolean
  pets: boolean
  driving: boolean
  languages: string[]
}

export interface CheckInEntry {
  rating: number
  comment: string
}

export interface Booking {
  id: string
  clientId: string
  workerId: string
  serviceType: ServiceCategory
  workType: WorkType
  startDate: Timestamp
  duration: string
  clientAddress: ClientAddress
  requirements: BookingRequirements
  placementFee: number
  placementFeePaid: boolean
  paynowPollUrl: string
  paynowStatus: string
  status: BookingStatus
  workerArrivedAt: Timestamp | null
  clientCheckIn: Record<string, CheckInEntry>
  replacementRequested: boolean
  replacementReason: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserAddress {
  label: string
  street: string
  suburb: string
  city: string
  lat: number
  lng: number
}

export type UserRole = 'client' | 'admin' | 'verifier' | 'creator' | 'sponsor' | 'advertise'

export type TransactionType =
  | 'referral_bonus'
  | 'referral_grandparent'
  | 'verifier_payout'
  | 'ambassador_share'
  | 'creator_payout'
  | 'sponsor_bonus'
  | 'ad_revenue'
  | 'withdrawal'
  | 'placement_fee'
  | 'cashback'

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  balance: number
  reference: string
  description: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: Timestamp
}

export type PayoutMethod = 'ecocash' | 'onemoney' | 'innbucks' | 'bank' | 'airtime' | 'data' | 'traamand_credit'

export interface Payout {
  id: string
  userId: string
  amount: number
  method: PayoutMethod
  recipient: string
  fee: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  notes: string
  requestedAt: Timestamp
  completedAt: Timestamp | null
}

export interface User {
  id: string
  name: string
  phone: string
  email: string
  whatsappNumber: string
  addresses: UserAddress[]
  bookings: string[]
  favoriteWorkers: string[]
  role: UserRole
  referralCode: string
  referredBy: string
  earningsBalance: number
  referralClicks: number
  createdAt: Timestamp
}

export type ApplicantStatus =
  | 'new'
  | 'screened'
  | 'interviewed'
  | 'training'
  | 'approved'
  | 'converted'
  | 'rejected'

export interface Applicant {
  id: string
  position: string
  fullName: string
  phone: string
  age: number
  yearsOfExperience: number
  nextOfKinContact: string
  education: string
  primaryLanguage: string
  nationalIdUrl: string
  policeClearanceUrl: string
  status: ApplicantStatus
  notes: string
  reviewedBy: string
  reviewedAt: Timestamp | null
  interviewDate: Timestamp | null
  interviewNotes: string
  convertedWorkerId: string
  source: string
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface LocationPage {
  id: string
  city: string
  suburb: string
  serviceType: ServiceCategory
  metaTitle: string
  metaDescription: string
  h1: string
  content: string
  landmarks: string[]
  availableWorkerCount: number
  averageRating: number
  recentHires: number
  topWorkers: string[]
  structuredData: Record<string, unknown>
  updatedAt: Timestamp
}

export type VerificationStatus = 'pending' | 'pass' | 'fail'

export interface AmbassadorTier {
  name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  minReferrals: number
  minHires: number
  revenueSharePercent: number
  bonusAmount: number
  badgeColor: string
}

export interface ReferralNode {
  user: User
  level: number
  children: ReferralNode[]
  hires: number
  earnedFromHere: number
}

export interface LeaderboardEntry {
  userId: string
  name: string
  referralClicks: number
  referralSignups: number
  referralHires: number
  earningsBalance: number
}

export interface DocumentVerification {
  status: VerificationStatus
  verifiedAt: Timestamp | null
  verifiedBy: string
  method: 'gemini' | 'manual'
  extractedData: Record<string, string>
  confidence: number
  issues: string[]
}

export interface VerifierTask {
  id: string
  applicantId: string
  applicantName: string
  applicantPhone: string
  location: string
  taskType: 'id_check' | 'full_verify'
  status: 'open' | 'assigned' | 'completed' | 'cancelled'
  assignedTo: string
  fee: number
  notes: string
  resultNotes: string
  createdAt: Timestamp
  assignedAt: Timestamp | null
  completedAt: Timestamp | null
}

export interface CreatorSubmission {
  id: string
  userId: string
  creatorCode: string
  contentType: 'tiktok' | 'instagram' | 'facebook' | 'youtube' | 'blog' | 'testimonial'
  url: string
  screenshotUrl: string
  views: number
  engagements: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  payoutAmount: number
  adminNotes: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Sponsorship {
  id: string
  sponsorId: string
  workerId: string
  workerName: string
  clientName: string
  monthlyBudget: number
  traamandFee: number
  status: 'active' | 'paused' | 'ended'
  startDate: Timestamp
  nextPaymentDate: Timestamp | null
  createdAt: Timestamp
}

export interface AdCampaign {
  id: string
  businessName: string
  businessContact: string
  description: string
  targetCategory: string
  budget: number
  spend: number
  impressions: number
  clicks: number
  conversions: number
  status: 'active' | 'paused' | 'ended'
  userId: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Invite {
  id: string
  email: string
  name: string
  role: UserRole
  invitedBy: string
  accepted: boolean
  createdAt: Timestamp
}

export interface ApplicantVerification {
  idVerification: DocumentVerification
  resumeParsing: DocumentVerification
  policeClearance: DocumentVerification
  overallScore: number
  recommendation: 'approved' | 'review' | 'rejected'
  summary: string
  lastVerifiedAt: Timestamp | null
}
