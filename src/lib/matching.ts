import { query, collection, where, getDocs, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { Booking } from '../types'

export interface MatchResult {
  booking: Booking
  score: number
  categoryMatch: boolean
  locationMatch: boolean
  workTypeMatch: boolean
  experienceBonus: number
  availabilityBonus: number
}

export function calculateMatchScore(
  booking: Booking,
  params: {
    position: string
    serviceAreas: string[]
    workType: string
    yearsOfExperience: number
    availabilityTimeline: string
  },
): MatchResult {
  const categoryMatch = booking.serviceType === params.position
  const locationMatch = params.serviceAreas.includes(booking.clientAddress.suburb)
  const workTypeMatch = booking.workType === params.workType

  const experienceBonus = params.yearsOfExperience >= 5 ? 10 : params.yearsOfExperience >= 3 ? 5 : 0
  const availabilityBonus = params.availabilityTimeline === 'immediately' ? 10 : params.availabilityTimeline === '2_weeks' ? 5 : 0

  const score = (categoryMatch ? 40 : 0) + (locationMatch ? 25 : 0) + (workTypeMatch ? 15 : 0) + experienceBonus + availabilityBonus

  return { booking, score, categoryMatch, locationMatch, workTypeMatch, experienceBonus, availabilityBonus }
}

export async function getMatchingInquiries(params: {
  position: string
  serviceAreas: string[]
  workType: string
  yearsOfExperience: number
  availabilityTimeline: string
}): Promise<MatchResult[]> {
  const q = query(
    collection(db, 'bookings'),
    where('status', '==', 'inquiry'),
    where('serviceType', '==', params.position),
    orderBy('createdAt', 'desc'),
    limit(20),
  )
  const snap = await getDocs(q)
  const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Booking)

  const results = bookings.map((b) => calculateMatchScore(b, params))
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, 5)
}
