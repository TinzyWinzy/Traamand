import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, uploadBytes } from 'firebase/storage'

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage, path) => path),
  uploadBytes: vi.fn().mockResolvedValue({ ref: 'mock-ref' }),
  getDownloadURL: vi.fn().mockResolvedValue('https://storage.example/file.mp4'),
}))

vi.mock('../firebase/config', () => ({
  storage: 'mock-storage',
}))

const { uploadApplicantVideo, uploadWorkerVideo, uploadApplicantPhoto, uploadWorkerPhoto, MAX_FILE_SIZE } = await import('../lib/upload')

describe('upload utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exposes MAX_FILE_SIZE as 20MB', () => {
    expect(MAX_FILE_SIZE).toBe(20 * 1024 * 1024)
  })

  it('uploadApplicantVideo uploads to applicants/{id}/intro_ path', async () => {
    const file = new File(['video'], 'intro.mp4', { type: 'video/mp4' })
    const url = await uploadApplicantVideo(file, 'applicant-1')

    expect(ref).toHaveBeenCalledWith('mock-storage', expect.stringMatching(/^applicants\/applicant-1\/intro_\d+_intro\.mp4$/))
    expect(uploadBytes).toHaveBeenCalledWith(expect.any(String), file, { contentType: 'video/mp4' })
    expect(url).toBe('https://storage.example/file.mp4')
  })

  it('uploadWorkerVideo uploads to workers/{id}/video_ path', async () => {
    const file = new File(['video'], 'intro.mp4', { type: 'video/mp4' })
    const url = await uploadWorkerVideo(file, 'worker-1')

    expect(ref).toHaveBeenCalledWith('mock-storage', expect.stringMatching(/^workers\/worker-1\/video_\d+_intro\.mp4$/))
    expect(uploadBytes).toHaveBeenCalledWith(expect.any(String), file, { contentType: 'video/mp4' })
    expect(url).toBe('https://storage.example/file.mp4')
  })

  it('uploadApplicantPhoto uploads to applicants/{id}/photo_ path', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const url = await uploadApplicantPhoto(file, 'applicant-1')

    expect(ref).toHaveBeenCalledWith('mock-storage', expect.stringMatching(/^applicants\/applicant-1\/photo_\d+_photo\.jpg$/))
    expect(url).toBe('https://storage.example/file.mp4')
  })

  it('uploadWorkerPhoto uploads to workers/{id}/photos/photo_ path', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const url = await uploadWorkerPhoto(file, 'worker-1')

    expect(ref).toHaveBeenCalledWith('mock-storage', expect.stringMatching(/^workers\/worker-1\/photos\/photo_\d+_photo\.jpg$/))
    expect(url).toBe('https://storage.example/file.mp4')
  })
})
