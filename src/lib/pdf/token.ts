import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

/** Short-lived signed token: lets the headless browser open the print page for one sheet only. */
const secret = () => process.env.PDF_SECRET || process.env.R2_SECRET_ACCESS_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev'

export function signPrint(payload: { key: string; mode: string; lang?: 'en' | 'ar'; course?: string }, ttlSec = 120) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSec * 1000 })).toString('base64url')
  const sig = createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyPrint(token: string | undefined): { key: string; mode: 'student' | 'doctor'; lang: 'en' | 'ar'; course?: string } | null {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const good = createHmac('sha256', secret()).update(body).digest()
  let given: Buffer
  try { given = Buffer.from(sig, 'base64url') } catch { return null }
  if (given.length !== good.length || !timingSafeEqual(given, good)) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (typeof p.exp !== 'number' || p.exp < Date.now()) return null
    return { key: p.key, mode: p.mode === 'doctor' ? 'doctor' : 'student', lang: p.lang === 'ar' ? 'ar' : 'en', course: p.course }
  } catch {
    return null
  }
}
