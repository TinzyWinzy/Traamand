import * as admin from 'firebase-admin'
import { onSchedule } from 'firebase-functions/v2/scheduler'

export const dailyFirestoreExport = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'Africa/Harare', maxInstances: 1 },
  async () => {
    const projectId = process.env.GCLOUD_PROJECT || 'studio-8895863664-52c12'
    const bucketName = `${projectId}-backups`
    const client = new admin.firestore.v1.FirestoreAdminClient()
    const databaseName = `projects/${projectId}/databases/(default)`

    try {
      const responses = await client.exportDocuments({
        name: databaseName,
        outputUriPrefix: `gs://${bucketName}/firestore-export`,
        collectionIds: [],
      })
      const response = responses[0]
      console.log(`Backup started: ${response.name}`)
    } catch (err) {
      console.error('Backup failed:', err)
    }
  }
)
