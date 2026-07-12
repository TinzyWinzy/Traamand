import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config'

export async function uploadApplicantFile(
  file: File,
  applicantId: string,
  type: 'nationalId' | 'policeClearance' | 'resume'
): Promise<string> {
  const path = `applicants/${applicantId}/${type}_${Date.now()}_${file.name}`
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}
