import { useState } from 'react'
import { useForm } from '@formspree/react'
import { Check, Upload, Loader2, Briefcase, Clock, Building2, TrendingUp } from 'lucide-react'
import { EDUCATION_LEVELS, LANGUAGES, SERVICE_CATEGORIES } from '../../lib/constants'
import { createApplicant } from '../../firebase/firestore'
import { uploadApplicantFile } from '../../lib/upload'

const FORM_ID = 'mrewbdrv'

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
  const [data, setData] = useState<FormData>(INITIAL)
  const [state, handleSubmit] = useForm(FORM_ID)
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null)
  const [policeClearanceFile, setPoliceClearanceFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [didValidate, setDidValidate] = useState(false)
  const [uploading, setUploading] = useState(false)

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
        status: 'new',
        notes: '',
        reviewedBy: '',
        reviewedAt: null,
        interviewDate: null,
        interviewNotes: '',
        convertedWorkerId: '',
        source: 'join_team_form',
      })

      if (nationalIdFile) {
        const url = await uploadApplicantFile(nationalIdFile, applicantId, 'nationalId')
        const { updateApplicant } = await import('../../firebase/firestore')
        await updateApplicant(applicantId, { nationalIdUrl: url })
      }
      if (policeClearanceFile) {
        const url = await uploadApplicantFile(policeClearanceFile, applicantId, 'policeClearance')
        const { updateApplicant } = await import('../../firebase/firestore')
        await updateApplicant(applicantId, { policeClearanceUrl: url })
      }
    } catch (err) {
      console.error('Failed to save applicant to Firestore:', err)
    }

    setUploading(false)
    handleSubmit(e)
  }

  if (state.succeeded) {
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
        <input type="hidden" name="position" value={data.position} />
        <input type="hidden" name="fullName" value={data.fullName} />
        <input type="hidden" name="phone" value={data.phone} />
        <input type="hidden" name="age" value={data.age} />
        <input type="hidden" name="yearsOfExperience" value={data.yearsOfExperience} />
        <input type="hidden" name="nextOfKinContact" value={data.nextOfKinContact} />
        <input type="hidden" name="education" value={data.education} />
        <input type="hidden" name="primaryLanguage" value={data.primaryLanguage} />
        <input type="hidden" name="nationalId" value={nationalIdFile?.name || ''} />
        <input type="hidden" name="policeClearance" value={policeClearanceFile?.name || ''} />
        <input type="hidden" name="_subject" value={data.position ? `New Application - ${data.position} - Join Our Team` : 'New Job Seeker Application - Join Our Team'} />

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

          <button
            type="submit"
            disabled={state.submitting || uploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(state.submitting || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? 'Uploading files...' : state.submitting ? 'Submitting...' : 'Submit Application'}
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
