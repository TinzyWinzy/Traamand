import { useState, useEffect } from 'react'
import { Check, Upload, Loader2, X, Video, Briefcase, Clock, Building2, TrendingUp } from 'lucide-react'
import { EDUCATION_LEVELS, LANGUAGES, SERVICE_CATEGORIES } from '../../lib/constants'
import { createApplicant, updateApplicant } from '../../firebase/firestore'
import { uploadApplicantFile, uploadApplicantPhoto, uploadApplicantVideo, MAX_FILE_SIZE } from '../../lib/upload'
import { useAuthStore } from '../../stores/authStore'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

const SELLING_POINTS = [
  { icon: Briefcase, text: 'Immediate Job Placement — quick matching with families and businesses looking for help.' },
  { icon: Clock, text: 'Flexible Working Hours — full-time, part-time, or live-out arrangements to suit your schedule.' },
  { icon: Building2, text: 'Trusted Employers — we screen households to ensure a safe, reliable working environment.' },
  { icon: TrendingUp, text: 'Good Pay Structures — we advocate for fair, market-rate wages for all placed workers.' },
]

interface FormData {
  position: string
  fullName: string
  phone: string
  age: string
  yearsOfExperience: string
  nextOfKinContact: string
  education: string
  primaryLanguage: string
}

const INITIAL: FormData = {
  position: '',
  fullName: '',
  phone: '',
  age: '',
  yearsOfExperience: '',
  nextOfKinContact: '',
  education: '',
  primaryLanguage: '',
}

export default function JoinTeamForm() {
  const { user } = useAuthStore()
  const [data, setData] = useState<FormData>(INITIAL)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [photoError, setPhotoError] = useState('')
  const [introVideoFile, setIntroVideoFile] = useState<File | null>(null)
  const [introVideoError, setIntroVideoError] = useState('')
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null)
  const [policeClearanceFile, setPoliceClearanceFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [didValidate, setDidValidate] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [applicantRef, setApplicantRef] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const update = (field: keyof FormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const errs: Partial<Record<string, string>> = {}

    if (!data.position) errs.position = 'Select a position'
    if (!data.fullName.trim()) errs.fullName = 'Full name is required'
    if (!data.phone.trim()) errs.phone = 'Phone number is required'
    else if (!/^0[0-9]{9}$/.test(data.phone.replace(/[\s-]/g, '')))
      errs.phone = 'Enter a valid Zimbabwe phone number'
    if (!data.age.trim() || Number(data.age) < 18) errs.age = 'You must be at least 18 years old'
    if (!data.yearsOfExperience.trim()) errs.yearsOfExperience = 'Years of experience is required'
    if (!data.nextOfKinContact.trim()) errs.nextOfKinContact = 'Next of kin contact is required'
    if (!data.education) errs.education = 'Select your highest level of education'
    if (!data.primaryLanguage) errs.primaryLanguage = 'Select your primary language'
    if (!nationalIdFile) errs.nationalId = 'National ID upload is required'
    if (!policeClearanceFile) errs.policeClearance = 'Police clearance upload is required'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDidValidate(true)
    if (!validate()) return
    setUploading(true)
    setSubmitError('')
    let createdApplicantId = ''

    try {
      const applicantId = await createApplicant({
        position: data.position,
        fullName: data.fullName,
        phone: data.phone,
        age: Number(data.age),
        yearsOfExperience: Number(data.yearsOfExperience),
        nextOfKinContact: data.nextOfKinContact,
        education: data.education,
        primaryLanguage: data.primaryLanguage,
        nationalIdUrl: nationalIdFile?.name || '',
        policeClearanceUrl: policeClearanceFile?.name || '',
        documentUploadStatus: 'pending',
        documentUploadError: '',
        status: 'new',
        notes: '',
        reviewedBy: '',
        reviewedAt: null,
        interviewDate: null,
        interviewNotes: '',
        convertedWorkerId: '',
        source: 'join_team_form',
        userId: user?.id || '',
      })
      createdApplicantId = applicantId

      if (user?.id && user.role === 'client') {
        await updateDoc(doc(db, 'users', user.id), { role: 'applicant' })
      }

      setApplicantRef(applicantId)
      const uploads: Promise<string>[] = [
        uploadApplicantFile(nationalIdFile!, applicantId, 'nationalId'),
        uploadApplicantFile(policeClearanceFile!, applicantId, 'policeClearance'),
      ]
      if (photoFile) {
        uploads.push(uploadApplicantPhoto(photoFile, applicantId))
      }
      if (introVideoFile) {
        uploads.push(uploadApplicantVideo(introVideoFile, applicantId))
      }

      const [nationalIdUrl, policeClearanceUrl, photoUrl, introVideoUrl] = await Promise.all(uploads)

      await updateApplicant(applicantId, {
        nationalIdUrl,
        policeClearanceUrl,
        ...(photoUrl ? { photoUrl } : {}),
        ...(introVideoUrl ? { introVideoUrl } : {}),
        documentUploadStatus: 'uploaded',
        documentUploadError: '',
      })

      setSubmitted(true)
    } catch (err) {
      console.error('Failed to save applicant:', err)
      if (createdApplicantId) {
        updateApplicant(createdApplicantId, {
          documentUploadStatus: 'failed',
          documentUploadError: (err as Error).message,
        }).catch(() => {})
      }
      setSubmitError('Something went wrong. Please try again or contact us on WhatsApp.')
    }

    setUploading(false)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-md sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-6 text-2xl font-bold text-slate-900">Application Received!</h3>
        <p className="mt-3 text-slate-500">
          Thank you, {data.fullName}. We&apos;ll review your application and get back to you
          within 48 hours.
        </p>
        {applicantRef && (
          <p className="mt-4 text-xs text-slate-400">
            Reference: <span className="font-mono font-semibold text-slate-600">{applicantRef.slice(0, 8)}</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {SELLING_POINTS.map((pt) => (
          <div key={pt.text} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <pt.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-600">{pt.text}</p>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 shadow-md sm:p-10">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
          <p className="mt-1 text-sm text-slate-500">
            All information is kept confidential and used only for recruitment.
          </p>
        </div>

        <div className="space-y-5">
          <Field label="Position Applying For" error={didValidate ? errors.position : undefined}>
            <select
              value={data.position}
              onChange={(e) => update('position', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            >
              <option value="">Select a position</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name" error={didValidate ? errors.fullName : undefined}>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="e.g. Chido Dube"
                autoComplete="name"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </Field>
            <Field label="Phone Number" error={didValidate ? errors.phone : undefined}>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="e.g. 0772 123 456"
                autoComplete="tel"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Age" error={didValidate ? errors.age : undefined}>
              <input
                type="number"
                min={18}
                max={99}
                value={data.age}
                onChange={(e) => update('age', e.target.value)}
                placeholder="e.g. 28"
                autoComplete="bday"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </Field>
            <Field label="Years of Experience" error={didValidate ? errors.yearsOfExperience : undefined}>
              <input
                type="number"
                min={0}
                max={50}
                value={data.yearsOfExperience}
                onChange={(e) => update('yearsOfExperience', e.target.value)}
                placeholder="e.g. 5"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Highest Level of Education" error={didValidate ? errors.education : undefined}>
              <select
                value={data.education}
                onChange={(e) => update('education', e.target.value)}
                autoComplete="education"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="">Select education</option>
                {EDUCATION_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </Field>
            <Field label="Primary Language" error={didValidate ? errors.primaryLanguage : undefined}>
              <select
                value={data.primaryLanguage}
                onChange={(e) => update('primaryLanguage', e.target.value)}
                autoComplete="language"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              >
                <option value="">Select language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Next of Kin Contact" error={didValidate ? errors.nextOfKinContact : undefined}>
            <input
              type="text"
              value={data.nextOfKinContact}
              onChange={(e) => update('nextOfKinContact', e.target.value)}
              placeholder="Name and phone number of next of kin"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </Field>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">Profile Photo</h3>
            <p className="mb-4 text-xs text-slate-500">Upload a recent photo of yourself</p>
            <div className="mb-5">
              {photoPreview ? (
                <div className="relative inline-block">
                  <img src={photoPreview} alt="Preview" className="h-32 w-32 rounded-xl object-cover border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(''); URL.revokeObjectURL(photoPreview) }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-teal-500 hover:text-teal-600 transition">
                  <Upload className="h-6 w-6" />
                  <span className="mt-1 text-xs font-medium">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 5 * 1024 * 1024) {
                        setPhotoError('Photo must be under 5MB')
                        return
                      }
                      setPhotoError('')
                      setPhotoFile(file)
                      URL.revokeObjectURL(photoPreview)
                      setPhotoPreview(URL.createObjectURL(file))
                    }}
                  />
                </label>
              )}
              {photoError && <p className="mt-2 text-xs text-red-600">{photoError}</p>}
            </div>

            <div className="mb-5 border-t border-slate-100 pt-5">
              <h3 className="mb-1 text-sm font-semibold text-slate-900">Intro Video (Optional)</h3>
              <p className="mb-4 text-xs text-slate-500">Upload a short introduction video</p>
              {introVideoFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Video className="h-5 w-5 text-teal-600" />
                  <span className="flex-1 truncate text-sm font-medium text-slate-700">{introVideoFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setIntroVideoFile(null); setIntroVideoError('') }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-slate-400 hover:border-teal-500 hover:text-teal-600 transition">
                  <Video className="h-6 w-6" />
                  <span className="text-sm font-medium">Upload Video</span>
                  <span className="text-xs">MP4, WebM, or MOV · max 20MB</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > MAX_FILE_SIZE) {
                        setIntroVideoError('Video must be under 20MB')
                        return
                      }
                      setIntroVideoError('')
                      setIntroVideoFile(file)
                    }}
                  />
                </label>
              )}
              {introVideoError && <p className="mt-2 text-xs text-red-600">{introVideoError}</p>}
            </div>

            <h3 className="mb-1 text-sm font-semibold text-slate-900">Required Documents</h3>
            <p className="mb-4 text-xs text-slate-500">Upload clear scans or photos</p>

            <div className="mb-3 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-700">
              Please ensure photos are clear and under 2MB to save your internet data.
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FileUpload
                label="National ID"
                error={didValidate ? errors.nationalId : undefined}
                fileName={nationalIdFile?.name || ''}
                onChange={(file) => setNationalIdFile(file)}
              />
              <FileUpload
                label="Police Clearance"
                error={didValidate ? errors.policeClearance : undefined}
                fileName={policeClearanceFile?.name || ''}
                onChange={(file) => setPoliceClearanceFile(file)}
              />
            </div>
          </div>

          {submitError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
          )}
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? 'Uploading files...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function FileUpload({
  label,
  error,
  fileName,
  onChange,
}: {
  label: string
  error?: string
  fileName: string
  onChange: (file: File) => void
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition ${
          fileName
            ? 'border-green-400 bg-green-50'
            : error
              ? 'border-red-600 bg-red-50'
              : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <Upload className={`h-6 w-6 ${fileName ? 'text-green-500' : 'text-slate-400'}`} />
        {fileName ? (
          <span className="font-medium text-green-700">{fileName}</span>
        ) : (
          <span className="text-slate-500">Click to upload</span>
        )}
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onChange(file)
          }}
        />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
