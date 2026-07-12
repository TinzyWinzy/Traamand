const ADJECTIVES = [
  'TENDAI', 'KUDZAI', 'TATENDA', 'NYASHA', 'TANAKA',
  'RUMBIDZAI', 'FARAI', 'SIMBA', 'TINO', 'MUNYA',
  'TARIRO', 'CHIDO', 'RUTENDO', 'KUDZANAI', 'PANASHE',
  'KUDA', 'TAKUDZWA', 'NYARADZO', 'TADIWANASHE', 'ANOPA',
]

const NOUNS = [
  'MAID', 'WORK', 'HOME', 'CLEAN', 'CARE',
  'HELP', 'TRUST', 'SAFE', 'BEST', 'TOP',
  'GOLD', 'STAR', 'LIFE', 'PEACE', 'JOY',
  'TEAM', 'ZERO', 'WISE', 'FINE', 'TRUE',
]

export function generateReferralCode(existing: Set<string> = new Set()): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    const num = Math.floor(10 + Math.random() * 90)
    const code = `${adj}${noun}${num}`
    if (!existing.has(code)) return code
  }
  return `TRA${Date.now().toString(36).toUpperCase()}`
}

export function isValidReferralCode(code: string): boolean {
  return /^[A-Z]{4,12}\d{2,4}$/i.test(code.trim())
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}
