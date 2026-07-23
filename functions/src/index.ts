import * as admin from 'firebase-admin'
import { setGlobalOptions } from 'firebase-functions/v2'

admin.initializeApp()
setGlobalOptions({ region: 'us-central1' })

export { sitemap } from './sitemap'
export { prerender } from './prerender'

export {
  setUserRole,
  verifyAdminAccess,
  initializeAdminUsers,
} from './admin'

export {
  processPaynowPayment,
  pollPaynowPayment,
  paynowCallback,
  processPayout,
  payoutCallback,
} from './paynow'

export {
  matchWorkerToBooking,
  sendBookingConfirmation,
  scheduleCheckIns,
  onBookingAuditAndAvailability,
  sendReplacementAlert,
} from './bookings'

export {
  onUserCreated,
  onApplicantConverted,
  onBookingCompleted,
} from './referrals'

export { onApplicantAudit } from './audit'

export {
  generateWorkerSEO,
  updateLocationStats,
} from './seo'

export { dailyFirestoreExport } from './backup'
