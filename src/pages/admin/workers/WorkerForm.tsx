import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
  ImagePlus,
  Trash2,
  Video,
} from 'lucide-react'
import { doc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { collection as fbCollection } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { uploadWorkerPhotos, uploadWorkerVideo, MAX_FILE_SIZE } from '../../../lib/upload'
import { useAuthStore } from '../../../stores/authStore'
import { useToastStore } from '../../../stores/toastStore'
import { generateWorkerSlug } from '../../../lib/worker'

const SERVICE_CATEGORIES = ['Maid', 'Nanny', 'Chef', 'Gardener', 'Nurse Aide', 'Driver', 'Sales Lady', 'Bar Lady']

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  Maid: ['cleaning', 'maid', 'housekeeping', 'laundry', 'ironing', 'dusting', 'mopping', 'deep cleaning', 'organizing'],
  Nanny: ['newborn care', 'infant care', 'childcare', 'nanny', 'toddler', 'first aid', 'feeding', 'bathing', 'early education'],
  Chef: ['cooking', 'baking', 'chef', 'meal planning', 'meal prep', 'pastry', 'grilling', 'dietary meals'],
  Gardener: ['gardening', 'lawn mowing', 'landscaping', 'garden', 'pruning', 'irrigation', 'hedge trimming', 'planting'],
  'Nurse Aide': ['elderly care', 'nurse aide', 'patient care', 'medication', 'mobility support', 'vital signs', 'bedside care'],
  Driver: ['driving', 'driver', 'chauffeur', 'route planning', 'defensive driving', 'school runs', 'vehicle maintenance'],
  'Sales Lady': ['sales', 'retail', 'customer service', 'cash handling', 'merchandising', 'inventory'],
  'Bar Lady': ['bartending', 'mixology', 'bar', 'customer service', 'stock control', 'event service'],
}
const HARARE_SUBURBS = [
  'Avondale', 'Belgravia', 'Borrowdale', 'Chisipite', 'Eastlea', 'Glen Lorne',
  'Greendale', 'Gunhill', 'Hatfield', 'Highlands', 'Kensington', 'Mabelreign',
  'Marlborough', 'Meyrick Park', 'Mt Pleasant', 'Newlands',
]
const WORK_TYPES = ['live-in', 'daily', 'part-time', 'temporary']

export default function WorkerForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [existingVideoUrl, setExistingVideoUrl] = useState('')
  const addToast = useToastStore((s) => s.addToast)

  useEffect(() => {
    return () => {
      photoPreviews.forEach((p) => URL.revokeObjectURL(p))
    }
  }, [photoPreviews])

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    category: 'Maid' as string,
    skills: [] as string[],
    newSkill: '',
    languages: [] as string[],
    newLanguage: '',
    preferredLocations: [] as string[],
    newLocation: '',
    workTypes: [] as string[],
    bio: '',
    experienceYears: 0,
    placementFee: 50,
    salaryMin: 100,
    salaryMax: 200,
    rating: 0,
    reviewCount: 0,
    hireCount: 0,
    verificationStatus: 'pending' as string,
    idVerified: false,
    policeClearance: false,
    medicalClearance: false,
    trainingCompleted: false,
    isActive: true,
  })

  const loadWorker = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const snap = await getDoc(doc(db, 'workers', id))
    if (snap.exists()) {
      const w = snap.data()
      setForm({
        firstName: w.firstName || '',
        lastName: w.lastName || '',
        displayName: w.displayName || '',
        category: SERVICE_CATEGORIES.find((c) => w.skills?.[0]?.includes(c.toLowerCase())) || 'Maid',
        skills: w.skills || [],
        newSkill: '',
        languages: w.languages || [],
        newLanguage: '',
        preferredLocations: w.availability?.preferredLocations || [],
        newLocation: '',
        workTypes: w.availability?.workType || [],
        bio: w.bio || '',
        experienceYears: w.experienceYears || 0,
        placementFee: w.placementFee || 50,
        salaryMin: w.monthlySalaryRange?.min || 100,
        salaryMax: w.monthlySalaryRange?.max || 200,
        rating: w.rating || 0,
        reviewCount: w.reviewCount || 0,
        hireCount: w.hireCount || 0,
        verificationStatus: w.verificationStatus || 'pending',
        idVerified: w.divineSeal?.idVerified || false,
        policeClearance: w.divineSeal?.policeClearance || false,
        medicalClearance: w.divineSeal?.medicalClearance || false,
        trainingCompleted: w.divineSeal?.trainingCompleted || false,
        isActive: w.isActive ?? true,
      })
      setExistingPhotos(w.photos || [])
      setExistingVideoUrl(w.divineSeal?.referenceVideoUrl || '')
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'admin')) {
      navigate('/sign-in')
      return
    }
    if (isEdit) {
      loadWorker()
    }
  }, [authLoading, isAuthenticated, isEdit, loadWorker, navigate, user?.role])

  const addSkill = () => {
    if (form.newSkill.trim() && !form.skills.includes(form.newSkill.trim().toLowerCase())) {
      setForm({ ...form, skills: [...form.skills, form.newSkill.trim().toLowerCase()], newSkill: '' })
    }
  }

  const addLanguage = () => {
    if (form.newLanguage.trim() && !form.languages.includes(form.newLanguage.trim())) {
      setForm({ ...form, languages: [...form.languages, form.newLanguage.trim()], newLanguage: '' })
    }
  }

  const addLocation = () => {
    if (form.newLocation.trim() && !form.preferredLocations.includes(form.newLocation.trim())) {
      setForm({ ...form, preferredLocations: [...form.preferredLocations, form.newLocation.trim()], newLocation: '' })
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const oversized = files.find((f) => f.size > 5 * 1024 * 1024)
    if (oversized) {
      addToast('Each photo must be under 5MB', 'error')
      e.target.value = ''
      return
    }
    const previews = files.map((f) => URL.createObjectURL(f))
    setPhotoFiles((prev) => [...prev, ...files])
    setPhotoPreviews((prev) => [...prev, ...previews])
    e.target.value = ''
  }

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index])
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingPhoto = (index: number) => {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      addToast('Video must be under 20MB', 'error')
      e.target.value = ''
      return
    }
    setVideoFile(file)
  }

  const removeVideo = () => {
    setVideoFile(null)
    setExistingVideoUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const slug = generateWorkerSlug(form.firstName, form.lastName, form.preferredLocations[0], form.category)

    let photos = existingPhotos
    let videoUrl = existingVideoUrl
    if (id) {
      const photoUpload = photoFiles.length > 0
        ? uploadWorkerPhotos(photoFiles, id).then((u) => { photos = [...existingPhotos, ...u] })
        : Promise.resolve()
      const videoUpload = videoFile
        ? uploadWorkerVideo(videoFile, id).then((url) => { videoUrl = url })
        : Promise.resolve()
      try {
        await Promise.all([photoUpload, videoUpload])
      } catch {
        addToast('Failed to upload photos or video', 'error')
        setSaving(false)
        return
      }
    }

    const workerData = {
      firstName: form.firstName,
      lastName: form.lastName,
      displayName: form.displayName || `${form.firstName} ${form.lastName.charAt(0)}.`,
      slug,
      category: form.category,
      verificationStatus: form.verificationStatus,
      divineSeal: {
        idVerified: form.idVerified,
        policeClearance: form.policeClearance,
        referenceVideoUrl: videoUrl,
        medicalClearance: form.medicalClearance,
        trainingCompleted: form.trainingCompleted,
        verifiedAt: serverTimestamp(),
        verifiedBy: user?.name || 'admin',
      },
      photos,
      bio: form.bio,
      languages: form.languages,
      skills: form.skills,
      experienceYears: form.experienceYears,
      previousEmployers: 0,
      availability: {
        status: 'available',
        nextAvailable: null,
        preferredLocations: form.preferredLocations,
        workType: form.workTypes,
      },
      rating: form.rating,
      reviewCount: form.reviewCount,
      recentReviews: [],
      hireCount: form.hireCount,
      lastHiredAt: null,
      placementFee: form.placementFee,
      monthlySalaryRange: { min: form.salaryMin, max: form.salaryMax },
      metaTitle: `${form.displayName || form.firstName} - Verified ${form.category} in Harare | Traamand`,
      metaDescription: `${form.displayName || form.firstName} is a ${form.verificationStatus === 'premium' ? 'Divine Seal verified ' : ''}${form.category.toLowerCase()} with ${form.experienceYears} years experience.`,
      serviceAreas: form.preferredLocations,
      isActive: form.isActive,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    try {
      let workerId = id
      if (isEdit) {
        await setDoc(doc(db, 'workers', id!), { ...workerData, updatedAt: serverTimestamp() }, { merge: true })
      } else {
        const docRef = await addDoc(fbCollection(db, 'workers'), workerData)
        workerId = docRef.id
      }

      if (!id) {
        const newUploads: Promise<void>[] = []
        if (photoFiles.length > 0) {
          newUploads.push(
            uploadWorkerPhotos(photoFiles, workerId!).then((uploaded) =>
              setDoc(doc(db, 'workers', workerId!), { photos: uploaded, updatedAt: serverTimestamp() }, { merge: true })
            )
          )
        }
        if (videoFile) {
          newUploads.push(
            uploadWorkerVideo(videoFile, workerId!).then((url) =>
              setDoc(doc(db, 'workers', workerId!), { divineSeal: { referenceVideoUrl: url }, updatedAt: serverTimestamp() }, { merge: true })
            )
          )
        }
        await Promise.all(newUploads)
      }

      navigate('/admin/workers')
    } catch {
      addToast('Failed to save worker', 'error')
    }
    setSaving(false)
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  const update = (field: string, value: unknown) => setForm({ ...form, [field]: value })

  return (
    <section className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link to="/admin/workers" className="mb-4 inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
          <ArrowLeft className="h-4 w-4" /> Back to Workers
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {isEdit ? `Edit ${form.displayName || 'Worker'}` : 'Add New Worker'}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Basic Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={form.firstName} onChange={(v) => update('firstName', v)} />
              <Input label="Last Name" value={form.lastName} onChange={(v) => update('lastName', v)} />
              <Input label="Display Name" value={form.displayName} onChange={(v) => update('displayName', v)} placeholder="e.g. Maria K." />
              <Select label="Category" value={form.category} onChange={(v) => update('category', v)} options={SERVICE_CATEGORIES} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Brief professional description..."
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Photos</h2>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Worker Photos</label>
              <div className="flex flex-wrap gap-3">
                {existingPhotos.map((url, i) => (
                  <div key={`existing-${i}`} className="relative group">
                    <img src={url} alt="" className="h-24 w-24 rounded-xl object-cover border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(i)}
                      className="absolute -right-2 -top-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photoPreviews.map((preview, i) => (
                  <div key={`new-${i}`} className="relative group">
                    <img src={preview} alt="" className="h-24 w-24 rounded-xl object-cover border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(i)}
                      className="absolute -right-2 -top-2 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-teal-500 hover:text-teal-600 transition">
                  <ImagePlus className="h-6 w-6" />
                  <span className="mt-1 text-[10px] font-medium">Add Photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelect} />
                </label>
              </div>
              <p className="mt-2 text-xs text-slate-400">Upload worker photos. First photo will be used as the main profile image.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">Intro Video</label>
              {existingVideoUrl ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Video className="h-5 w-5 text-teal-600" />
                  <a href={existingVideoUrl} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm font-medium text-teal-600 hover:underline">
                    {existingVideoUrl.split('/').pop()}
                  </a>
                  <button type="button" onClick={removeVideo} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : videoFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Video className="h-5 w-5 text-teal-600" />
                  <span className="flex-1 truncate text-sm font-medium text-slate-700">{videoFile.name}</span>
                  <button type="button" onClick={removeVideo} className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-slate-400 hover:border-teal-500 hover:text-teal-600 transition">
                  <Video className="h-6 w-6" />
                  <div>
                    <p className="text-sm font-medium">Upload Intro Video</p>
                    <p className="text-xs">MP4, WebM, or MOV · max 20MB</p>
                  </div>
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                </label>
              )}
              <p className="mt-2 text-xs text-slate-400">Introduction video will play on the worker's public profile.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Skills & Languages</h2>
            <TagInput label="Skills" tags={form.skills} newValue={form.newSkill} onNewChange={(v) => update('newSkill', v)} onAdd={addSkill} onRemove={(s) => update('skills', form.skills.filter((t) => t !== s))} suggestions={SKILL_SUGGESTIONS[form.category] || []} />
            <TagInput label="Languages" tags={form.languages} newValue={form.newLanguage} onNewChange={(v) => update('newLanguage', v)} onAdd={addLanguage} onRemove={(s) => update('languages', form.languages.filter((t) => t !== s))} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Location & Availability</h2>
            <TagInput
              label="Preferred Locations"
              tags={form.preferredLocations}
              newValue={form.newLocation}
              onNewChange={(v) => update('newLocation', v)}
              onAdd={addLocation}
              onRemove={(s) => update('preferredLocations', form.preferredLocations.filter((t) => t !== s))}
              suggestions={HARARE_SUBURBS}
            />
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Work Types</label>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const updated = form.workTypes.includes(type)
                        ? form.workTypes.filter((t) => t !== type)
                        : [...form.workTypes, type]
                      update('workTypes', updated)
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                      form.workTypes.includes(type)
                        ? 'bg-teal-600 text-white'
                        : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {type.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Pricing & Experience</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Experience (years)" type="number" value={String(form.experienceYears)} onChange={(v) => update('experienceYears', Number(v))} />
              <Input label="Placement Fee ($)" type="number" value={String(form.placementFee)} onChange={(v) => update('placementFee', Number(v))} />
              <Input label="Salary Min ($)" type="number" value={String(form.salaryMin)} onChange={(v) => update('salaryMin', Number(v))} />
              <Input label="Salary Max ($)" type="number" value={String(form.salaryMax)} onChange={(v) => update('salaryMax', Number(v))} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Divine Seal Verification</h2>
            <div className="space-y-3">
              <Select label="Verification Status" value={form.verificationStatus} onChange={(v) => update('verificationStatus', v)} options={['pending', 'verified', 'premium']} />
              <Checkbox label="National ID Verified" checked={form.idVerified} onChange={(v) => update('idVerified', v)} />
              <Checkbox label="Police Clearance" checked={form.policeClearance} onChange={(v) => update('policeClearance', v)} />
              <Checkbox label="Medical Clearance" checked={form.medicalClearance} onChange={(v) => update('medicalClearance', v)} />
              <Checkbox label="Training Completed" checked={form.trainingCompleted} onChange={(v) => update('trainingCompleted', v)} />
              <Checkbox label="Active (visible to public)" checked={form.isActive} onChange={(v) => update('isActive', v)} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <Link
              to="/admin/workers"
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-200 transition-all hover:bg-teal-700 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {isEdit ? 'Update Worker' : 'Create Worker'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Checkbox({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded-lg border-slate-300 text-teal-600 focus:ring-teal-500"
      />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  )
}

function TagInput({ label, tags, newValue, onNewChange, onAdd, onRemove, suggestions }: {
  label: string
  tags: string[]
  newValue: string
  onNewChange: (v: string) => void
  onAdd: () => void
  onRemove: (tag: string) => void
  suggestions?: string[]
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 border border-teal-200">
            {tag}
            <button type="button" onClick={() => onRemove(tag)} className="ml-0.5 rounded p-0.5 hover:bg-teal-200 transition">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newValue}
          onChange={(e) => onNewChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
          placeholder={suggestions ? 'Type or select...' : 'Type and enter...'}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-500"
        />
        <button type="button" onClick={onAdd} className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {suggestions && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.filter((s) => !tags.includes(s)).slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onNewChange(s); setTimeout(onAdd, 0) }}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50 transition"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
