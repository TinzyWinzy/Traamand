import { getGenerativeModel } from '@firebase/vertexai'
import { vertexAI } from '../firebase/config'
import type { DocumentVerification, ApplicantVerification } from '../types'

let model: ReturnType<typeof getGenerativeModel> | null = null

function getModel() {
  if (!model) {
    model = getGenerativeModel(vertexAI, { model: 'gemini-1.5-flash' })
  }
  return model
}

export function makeVerification(
  overrides: Partial<DocumentVerification> = {}
): DocumentVerification {
  return {
    status: 'pending',
    verifiedAt: null,
    verifiedBy: '',
    method: 'gemini',
    extractedData: {},
    confidence: 0,
    issues: [],
    ...overrides,
  }
}

export async function verifyNationalId(imageUrl: string): Promise<DocumentVerification> {
  try {
    const result = await getModel().generateContent([
      {
        inlineData: { mimeType: 'image/jpeg', data: imageUrl },
      },
      {
        text: `You are a KYC document verification system. Analyze this National ID document and return a JSON object with:
- fullName: the full name on the ID
- idNumber: the ID number
- dateOfBirth: date of birth (YYYY-MM-DD)
- nationality: nationality listed
- isAuthentic: boolean indicating if the document appears genuine
- issues: array of strings describing any problems found (empty if none)
- confidence: number 0-100

Only respond with valid JSON, no other text.`,
      },
    ])

    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const data = JSON.parse(cleaned)

    return makeVerification({
      status: data.isAuthentic ? 'pass' : 'fail',
      extractedData: {
        fullName: data.fullName || '',
        idNumber: data.idNumber || '',
        dateOfBirth: data.dateOfBirth || '',
        nationality: data.nationality || '',
      },
      confidence: data.confidence || 0,
      issues: data.issues || [],
    })
  } catch (err) {
    return makeVerification({
      status: 'fail',
      issues: [err instanceof Error ? err.message : 'Verification failed'],
    })
  }
}

export async function parseResume(fileUrl: string, mimeType: string): Promise<DocumentVerification> {
  try {
    const result = await getModel().generateContent([
      {
        inlineData: { mimeType, data: fileUrl },
      },
      {
        text: `You are a resume/CV parsing system. Analyze this document and return a JSON object with:
- skills: array of skills found
- totalExperienceYears: number
- education: highest education level
- languages: array of languages listed
- previousEmployers: number of previous employers mentioned
- positionFit: "strong" | "moderate" | "weak" — how well this candidate fits domestic work roles (maid, nanny, chef, gardener, etc.)
- issues: array of concerns (empty if none)
- confidence: number 0-100

Only respond with valid JSON, no other text.`,
      },
    ])

    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const data = JSON.parse(cleaned)

    return makeVerification({
      status: data.confidence >= 50 ? 'pass' : 'fail',
      extractedData: {
        skills: (data.skills || []).join(', '),
        totalExperienceYears: String(data.totalExperienceYears || 0),
        education: data.education || '',
        languages: (data.languages || []).join(', '),
        previousEmployers: String(data.previousEmployers || 0),
        positionFit: data.positionFit || 'moderate',
      },
      confidence: data.confidence || 0,
      issues: data.issues || [],
    })
  } catch (err) {
    return makeVerification({
      status: 'fail',
      issues: [err instanceof Error ? err.message : 'Parsing failed'],
    })
  }
}

export async function verifyPoliceClearance(imageUrl: string): Promise<DocumentVerification> {
  try {
    const result = await getModel().generateContent([
      {
        inlineData: { mimeType: 'image/jpeg', data: imageUrl },
      },
      {
        text: `You are a police clearance certificate verification system. Analyze this document and return a JSON object with:
- issueDate: date of issue (YYYY-MM-DD)
- expiryDate: date of expiry (YYYY-MM-DD) or "N/A"
- certificateNumber: certificate reference number
- isAuthentic: boolean indicating if the document appears genuine
- issues: array of concerns (empty if none)
- confidence: number 0-100

Only respond with valid JSON, no other text.`,
      },
    ])

    const text = result.response.text()
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const data = JSON.parse(cleaned)

    return makeVerification({
      status: data.isAuthentic ? 'pass' : 'fail',
      extractedData: {
        issueDate: data.issueDate || '',
        expiryDate: data.expiryDate || '',
        certificateNumber: data.certificateNumber || '',
      },
      confidence: data.confidence || 0,
      issues: data.issues || [],
    })
  } catch (err) {
    return makeVerification({
      status: 'fail',
      issues: [err instanceof Error ? err.message : 'Verification failed'],
    })
  }
}

export function computeOverallVerification(
  id: DocumentVerification,
  resume: DocumentVerification,
  police: DocumentVerification
): ApplicantVerification {
  const allResults = [id, resume, police]
  const allIssues = allResults.flatMap((r) => r.issues)

  const passed = allResults.filter((r) => r.status === 'pass').length
  const pending = allResults.filter((r) => r.status === 'pending').length
  const completed = allResults.length - pending

  const avgConfidence = completed > 0
    ? allResults.filter((r) => r.status !== 'pending').reduce((sum, r) => sum + r.confidence, 0) / completed
    : 0

  let recommendation: 'approved' | 'review' | 'rejected'
  if (completed === 0) {
    recommendation = 'review'
  } else if (id.status === 'fail') {
    recommendation = 'rejected'
  } else if (id.status === 'pass' && police.status === 'pass') {
    recommendation = avgConfidence >= 70 ? 'approved' : 'review'
  } else if (id.status === 'pass') {
    recommendation = 'review'
  } else {
    recommendation = 'rejected'
  }

  const idScore = id.status === 'pass' ? 60 * (id.confidence / 100) : 0
  const policeScore = police.status === 'pass' ? 40 * (police.confidence / 100) : 0
  const overallScore = Math.round(idScore + policeScore)

  return {
    idVerification: id,
    resumeParsing: resume,
    policeClearance: police,
    overallScore,
    recommendation,
    summary: allIssues.length > 0
      ? `${passed} passed, ${pending} pending. Issues: ${allIssues.join('; ')}`
      : `${passed} passed, ${pending} pending.`,
    lastVerifiedAt: null,
  }
}
