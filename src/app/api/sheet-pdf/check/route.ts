import { NextResponse } from 'next/server'
import { existsSync } from 'node:fs'
import { getViewer } from '@/lib/auth'
import { renderSheetPdf } from '@/lib/pdf/render'

export const maxDuration = 60
export const runtime = 'nodejs'

/**
 * PDF self-test: builds a PDF of a built-in example sheet and reports every step.
 * Open /api/sheet-pdf/check (admin; on a local computer no sign-in is needed).
 */
export async function GET(req: Request) {
  const local = process.env.NODE_ENV === 'development' || !process.env.VERCEL
  const { user, isAdmin } = await getViewer()
  if (!local && !isAdmin) {
    return NextResponse.json({ ok: false, step: 'sign-in', error: user ? 'This account is not an admin.' : 'Sign in as the admin first (ahmadelajou.com/login), then open this page again.' }, { status: 403 })
  }
  const info: Record<string, unknown> = {
    where: process.env.VERCEL ? `Vercel (${process.env.VERCEL_REGION || 'region ?'})` : 'local computer',
    node: process.version,
  }
  if (!process.env.VERCEL) {
    const candidates = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium']
    info.browser = candidates.find((p) => p && existsSync(p)) || 'NOT FOUND — install Google Chrome or set CHROME_PATH in .env.local'
  }
  const t0 = Date.now()
  try {
    const pdf = await renderSheetPdf({ origin: new URL(req.url).origin, key: 'sample:lecture1', mode: 'student', lang: 'en', footer: 'PDF check' })
    return NextResponse.json({ ok: true, ...info, pages_bytes: pdf.length, seconds: (Date.now() - t0) / 1000 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, ...info, step: 'render', error: String(e?.message || e), seconds: (Date.now() - t0) / 1000 }, { status: 500 })
  }
}
