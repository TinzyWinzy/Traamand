import { onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { writeAuditLog } from './helpers'

export const onApplicantAudit = onDocumentUpdated(
  { document: 'applicants/{applicantId}' },
  async (event) => {
    const before = event.data?.before.data()
    const after = event.data?.after.data()
    if (!before || !after) return
    await writeAuditLog('applicant', event.params.applicantId, before, after)
  }
)
