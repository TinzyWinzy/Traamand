import * as admin from 'firebase-admin'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'

const db = () => admin.firestore()

export const generateWorkerSEO = onDocumentCreated('workers/{workerId}', async (event) => {
  const worker = event.data?.data()
  if (!worker) return

  const slug = worker.slug || `${worker.firstName}-${worker.lastName}-${worker.serviceAreas?.[0] || 'harare'}-${worker.skills?.[0] || 'worker'}`
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const metaTitle = `${worker.displayName || `${worker.firstName} ${worker.lastName.charAt(0)}.`} - Verified ${worker.skills?.[0] || 'Domestic Worker'} in Harare | Traamand`
  const metaDescription = `${worker.displayName} is a Divine Seal verified ${worker.skills?.[0]?.toLowerCase() || 'domestic worker'} in Harare with ${worker.experienceYears} years experience. ${worker.rating}-star rating from ${worker.reviewCount} reviews.`

  await event.data?.ref.update({
    slug,
    displayName: worker.displayName || `${worker.firstName} ${worker.lastName.charAt(0)}.`,
    metaTitle,
    metaDescription,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
})

export const updateLocationStats = onDocumentUpdated(
  { document: 'workers/{workerId}' },
  async (event) => {
    const worker = event.data?.after.data()
    if (!worker) return

    for (const suburb of worker.availability?.preferredLocations || []) {
      for (const skill of worker.skills || []) {
        const pageId = `harare-${suburb.toLowerCase()}-${skill.toLowerCase()}`.replace(/\s+/g, '-')

        const snap = await db()
          .collection('workers')
          .where('isActive', '==', true)
          .where('availability.status', '==', 'available')
          .where('availability.preferredLocations', 'array-contains', suburb)
          .get()

        const ratings = snap.docs
          .map((d) => d.data().rating)
          .filter((r) => typeof r === 'number') as number[]

        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0

        await db().collection('locationPages').doc(pageId).set(
          {
            availableWorkerCount: snap.size,
            averageRating: Math.round(avgRating * 10) / 10,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      }
    }
  }
)
