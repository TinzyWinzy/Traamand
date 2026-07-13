import { COMPANY_NAME } from './constants'
import type { Applicant, Booking, User } from '../types'

const WHATSAPP_URL = 'https://wa.me'

export function generateWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/[\s\-()+]/g, '')
  return `${WHATSAPP_URL}/${clean}?text=${encodeURIComponent(message)}`
}

export function generateHireInquiryMessage(
  workerId: string,
  workerName: string,
  category: string
): string {
  return [
    `Hi ${COMPANY_NAME}, I am interested in hiring ${workerName}.`,
    ``,
    `Profile: #${workerId}`,
    `Role: ${category}`,
  ].join('\n')
}

export function generateSupportMessage(bookingId: string): string {
  return [
    `Hi ${COMPANY_NAME}, I need support regarding my booking.`,
    ``,
    `Booking Reference: #${bookingId}`,
  ].join('\n')
}

export function generateReplacementRequestMessage(bookingId: string, reason: string): string {
  return [
    `Hi ${COMPANY_NAME}, I would like to request a replacement.`,
    ``,
    `Booking Reference: #${bookingId}`,
    `Reason: ${reason}`,
  ].join('\n')
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ')
}

function formatStartDate(value: unknown): string {
  const date =
    value && typeof value === 'object' && 'toDate' in value
      ? (value as { toDate: () => Date }).toDate()
      : null

  return date
    ? date.toLocaleDateString('en-ZW', { weekday: 'long', month: 'long', day: 'numeric' })
    : 'the agreed date'
}

export function getUserWhatsAppNumber(user?: Partial<User> | null): string {
  return user?.whatsappNumber || user?.phone || ''
}

export function generateBookingPipelineMessage(
  booking: Booking,
  workerName: string,
  clientName = 'there'
): string {
  return [
    `Hi ${clientName.split(' ')[0] || 'there'}, this is ${COMPANY_NAME}.`,
    ``,
    `Booking update: ${formatStatus(booking.status)}`,
    `Worker: ${workerName}`,
    `Service: ${booking.serviceType}`,
    `Start date: ${formatStartDate(booking.startDate)}`,
    `Area: ${booking.clientAddress?.suburb || booking.clientAddress?.city || 'Harare'}`,
    ``,
    `Reference: #${booking.id.slice(0, 8)}`,
  ].join('\n')
}

export function generateBookingAdminMessage(
  booking: Booking,
  workerName: string,
  clientName = 'Unknown client'
): string {
  return [
    `Booking pipeline action needed.`,
    ``,
    `Reference: #${booking.id.slice(0, 8)}`,
    `Status: ${formatStatus(booking.status)}`,
    `Client: ${clientName}`,
    `Worker: ${workerName}`,
    `Service: ${booking.serviceType} (${booking.workType})`,
    `Start date: ${formatStartDate(booking.startDate)}`,
    `Address: ${[booking.clientAddress?.street, booking.clientAddress?.suburb, booking.clientAddress?.city].filter(Boolean).join(', ') || 'Not captured'}`,
    `Placement fee: $${booking.placementFee || 0} (${booking.placementFeePaid ? 'paid' : 'pending'})`,
  ].join('\n')
}

export function generateApplicantPipelineMessage(applicant: Applicant): string {
  const firstName = applicant.fullName.split(' ')[0] || 'there'

  return [
    `Hi ${firstName}, this is ${COMPANY_NAME}.`,
    ``,
    `Application update: ${formatStatus(applicant.status)}`,
    `Position: ${applicant.position}`,
    ``,
    `Reference: #${applicant.id.slice(0, 8)}`,
  ].join('\n')
}

export function generateApplicantAdminMessage(applicant: Applicant): string {
  return [
    `Applicant pipeline action needed.`,
    ``,
    `Reference: #${applicant.id.slice(0, 8)}`,
    `Name: ${applicant.fullName}`,
    `Phone: ${applicant.phone || 'Not captured'}`,
    `Position: ${applicant.position}`,
    `Status: ${formatStatus(applicant.status)}`,
    `Experience: ${applicant.yearsOfExperience} years`,
  ].join('\n')
}

export const WHATSAPP_NUMBERS = {
  bookings: '+263715325922',
  applications: '+263782329308',
  general: '+263777566584',
} as const
