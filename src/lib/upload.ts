import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config'

export const MAX_FILE_SIZE = 20 * 1024 * 1024

async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}

export async function uploadApplicantFile(
  file: File,
  applicantId: string,
  type: 'nationalId' | 'policeClearance' | 'resume'
): Promise<string> {
  return uploadFile(`applicants/${applicantId}/${type}_${Date.now()}_${file.name}`, file)
}

export async function uploadApplicantPhoto(
  file: File,
  applicantId: string
): Promise<string> {
  return uploadFile(`applicants/${applicantId}/photo_${Date.now()}_${file.name}`, file)
}

export async function uploadApplicantVideo(
  file: File,
  applicantId: string
): Promise<string> {
  return uploadFile(`applicants/${applicantId}/intro_${Date.now()}_${file.name}`, file)
}

export async function uploadWorkerPhoto(
  file: File,
  workerId: string
): Promise<string> {
  return uploadFile(`workers/${workerId}/photos/photo_${Date.now()}_${file.name}`, file)
}

export async function uploadWorkerPhotos(
  files: File[],
  workerId: string
): Promise<string[]> {
  return Promise.all(files.map((file) => uploadWorkerPhoto(file, workerId)))
}

export async function uploadWorkerVideo(
  file: File,
  workerId: string
): Promise<string> {
  return uploadFile(`workers/${workerId}/video_${Date.now()}_${file.name}`, file)
}
