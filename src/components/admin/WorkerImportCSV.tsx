import { useState, useRef } from 'react'
import { Upload, FileJson, AlertCircle, CheckCircle2, X, Loader2, Download, RefreshCw } from 'lucide-react'
import { collection, writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useToastStore } from '../../stores/toastStore'
import type { Worker, WorkType } from '../../types'

interface ImportError {
  row: number
  errors: Record<string, string>
  data: Record<string, string>
}

interface ImportResult {
  successful: number
  failed: number
  errors: ImportError[]
  warnings: string[]
}

interface Props {
  onSuccess?: () => void
}

export default function WorkerImportCSV({ onSuccess }: Props) {
  const [showImport, setShowImport] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addToast = useToastStore((s) => s.addToast)

  const downloadTemplate = () => {
    const header = [
      'firstName', 'lastName', 'phone', 'age', 'email', 'category',
      'yearsOfExperience', 'skills', 'previousEmployers', 'workType',
      'preferredLocations', 'monthlySalaryMin', 'monthlySalaryMax',
      'placementFee', 'idVerified', 'policeClearance', 'referenceChecks',
      'education', 'languages', 'nextOfKinContact', 'status', 'notes'
    ].join(',')

    const exampleRows = [
      ['Maria', 'Dube', '0715325922', '32', 'maria@email.com', 'Maid', '8', 'cleaning,laundry,cooking', '5', 'daily', 'Borrowdale,Chisipite', '2000', '3000', '50', 'yes', 'yes', 'yes', 'Secondary (O-Level)', 'Shona', '0776123456', 'available', 'Previously with family in Borrowdale'].join(','),
      ['John', 'Smith', '0782329308', '45', 'john@email.com', 'Driver', '12', 'driving,maintenance', '8', 'daily', 'Harare East', '4000', '5000', '60', 'yes', 'yes', 'yes', 'Certificate / Diploma', 'English', '0712456789', 'available', 'Has PSV license'].join(','),
      ['Linda', 'Ndlovu', '0777566584', '28', 'linda@email.com', 'Nanny', '6', 'childcare,newborn,infant', '3', 'live-in', 'Glen Lorne,Chisipite', '3000', '4000', '55', 'yes', 'no', 'yes', 'Certificate / Diploma', 'Shona,English', '0712789456', 'available', 'CPR certified'].join(','),
    ]

    const csv = [header, ...exampleRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'traamand-employee-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const validateRow = (row: Record<string, string>, rowNum: number): { valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}

    // Required fields
    if (!row.firstName?.trim()) errors.firstName = 'Required'
    if (!row.lastName?.trim()) errors.lastName = 'Required'
    if (!row.phone?.trim()) errors.phone = 'Required'
    else if (!/^0[0-9]{9}$/.test(row.phone.replace(/[\s-]/g, ''))) errors.phone = 'Invalid ZW phone'

    if (!row.age) errors.age = 'Required'
    else if (Number(row.age) < 18) errors.age = 'Must be 18+'

    if (!row.category) errors.category = 'Required'
    else if (!['Maid', 'Nanny', 'Chef', 'Gardener', 'Nurse Aide', 'Driver', 'Sales Lady', 'Bar Lady'].includes(row.category))
      errors.category = 'Invalid category'

    if (!row.yearsOfExperience) errors.yearsOfExperience = 'Required'
    else if (Number(row.yearsOfExperience) < 0) errors.yearsOfExperience = 'Invalid'

    if (!row.skills?.trim()) errors.skills = 'Required (comma-separated)'
    if (!row.education) errors.education = 'Required'
    if (!row.languages?.trim()) errors.languages = 'Required (comma-separated)'
    if (!row.placementFee) errors.placementFee = 'Required'
    if (!row.idVerified || !['yes', 'no'].includes(row.idVerified)) errors.idVerified = 'Must be yes/no'
    if (!row.policeClearance || !['yes', 'no'].includes(row.policeClearance)) errors.policeClearance = 'Must be yes/no'

    return { valid: Object.keys(errors).length === 0, errors }
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) {
      addToast('CSV must have header + at least 1 data row', 'error')
      return null
    }

    const headers = lines[0].split(',').map(h => h.trim())
    const rows: Record<string, string>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ''
      })
      rows.push(row)
    }

    return rows
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (!f.name.endsWith('.csv')) {
      addToast('Please select a CSV file', 'error')
      return
    }

    setFile(f)
  }

  const handleImport = async () => {
    if (!file) {
      addToast('Select a CSV file first', 'error')
      return
    }

    setParsing(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (!rows) {
        setParsing(false)
        return
      }

      // Validate all rows first
      const validRows: { data: Record<string, string>; rowNum: number }[] = []
      const errors: ImportError[] = []

      rows.forEach((row, idx) => {
        const { valid, errors: rowErrors } = validateRow(row, idx + 2)
        if (valid) {
          validRows.push({ data: row, rowNum: idx + 2 })
        } else {
          errors.push({ row: idx + 2, errors: rowErrors, data: row })
        }
      })

      if (errors.length > 0 && validRows.length === 0) {
        setParsing(false)
        setResult({ successful: 0, failed: errors.length, errors, warnings: [] })
        addToast(`${errors.length} row(s) have validation errors`, 'error')
        return
      }

      if (validRows.length === 0) {
        setParsing(false)
        addToast('No valid rows to import', 'error')
        return
      }

      // Import valid rows
      setImporting(true)
      setParsing(false)

      const batch = writeBatch(db)
      let successCount = 0

      validRows.forEach(({ data }) => {
        const workerId = doc(collection(db, 'workers')).id

        const worker: Partial<Worker> = {
          id: workerId,
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: `${data.firstName} ${data.lastName.charAt(0)}.`,
          slug: `${data.firstName.toLowerCase()}-${data.lastName.toLowerCase()}-${data.category.toLowerCase()}`,
          category: data.category,
          verificationStatus: 'pending',
          divineSeal: {
            idVerified: data.idVerified === 'yes',
            policeClearance: data.policeClearance === 'yes',
            referenceVideoUrl: '',
            medicalClearance: false,
            trainingCompleted: false,
            verifiedAt: null,
            verifiedBy: '',
          },
          photos: [],
          bio: '',
          languages: data.languages.split(',').map(l => l.trim()),
          skills: data.skills.split(',').map(s => s.trim()),
          experienceYears: Number(data.yearsOfExperience),
          previousEmployers: Number(data.previousEmployers || 0),
          availability: {
            status: (data.status || 'available') as 'available' | 'booked' | 'off',
            nextAvailable: null,
            preferredLocations: data.preferredLocations?.split(',').map(l => l.trim()) || [],
            workType: [data.workType || 'daily'] as WorkType[],
          },
          rating: 0,
          reviewCount: 0,
          recentReviews: [],
          hireCount: 0,
          lastHiredAt: null,
          placementFee: Number(data.placementFee),
          monthlySalaryRange: {
            min: Number(data.monthlySalaryMin || 0),
            max: Number(data.monthlySalaryMax || 0),
          },
          metaTitle: `${data.firstName} ${data.lastName} - ${data.category} in Harare | Traamand`,
          metaDescription: `${data.firstName} is an experienced ${data.category.toLowerCase()} with ${data.yearsOfExperience} years of experience in Harare. Verified and ready to work.`,
          serviceAreas: data.preferredLocations?.split(',').map(l => l.trim()) || [],
          isActive: true,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        }

        batch.set(doc(db, 'workers', workerId), worker)
        successCount++
      })

      await batch.commit()
      setImporting(false)
      setResult({
        successful: successCount,
        failed: errors.length,
        errors,
        warnings: []
      })

      addToast(`✅ Imported ${successCount} workers successfully`, 'success')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      // Trigger callback to refresh data in parent component
      if (onSuccess) {
        setTimeout(() => onSuccess(), 500)
      }
    } catch (err) {
      setImporting(false)
      setParsing(false)
      addToast('Import failed: ' + (err as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-4">
      {!showImport ? (
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
        >
          <Upload className="h-4 w-4" />
          Bulk Import CSV
        </button>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Bulk Import Employee Records</h3>
            <button
              onClick={() => { setShowImport(false); setResult(null) }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!result ? (
            <>
              <p className="mb-4 text-sm text-slate-600">
                Import employee records from Excel, Word, or physical books. Download the template, fill in your data, and upload the CSV.
              </p>

              <div className="mb-4 flex gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Select CSV File</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    disabled={parsing || importing}
                  />
                  {file && <span className="text-sm text-green-600 font-semibold">{file.name}</span>}
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={!file || parsing || importing}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {parsing || importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
                {parsing ? 'Validating...' : importing ? 'Importing...' : 'Import'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="text-2xl font-bold text-green-700">{result.successful}</div>
                  <div className="text-sm text-green-600">Successfully imported</div>
                </div>
                {result.failed > 0 && (
                  <div className="rounded-lg bg-red-50 p-4">
                    <div className="text-2xl font-bold text-red-700">{result.failed}</div>
                    <div className="text-sm text-red-600">Failed rows</div>
                  </div>
                )}
              </div>

              {/* Error Details */}
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    Validation Errors ({result.errors.length})
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {result.errors.map((error, idx) => (
                      <div key={idx} className="rounded bg-white p-2 text-xs">
                        <p className="font-semibold text-slate-900">Row {error.row}:</p>
                        <ul className="ml-4 mt-1 list-disc space-y-0.5 text-red-600">
                          {Object.entries(error.errors).map(([field, msg]) => (
                            <li key={field}>{field}: {msg}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setResult(null); setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Import Another File
                </button>
                <button
                  onClick={() => { setShowImport(false); setResult(null) }}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
