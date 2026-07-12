import { COMPANY_NAME } from './constants'

const WHATSAPP_URL = 'https://wa.me'

export function generateWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/[\s\-()]/g, '')
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

export const WHATSAPP_NUMBERS = {
  bookings: '+263715325922',
  applications: '+263782329308',
  general: '+263777566584',
} as const
