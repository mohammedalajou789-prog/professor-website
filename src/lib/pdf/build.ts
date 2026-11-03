import 'server-only'
import { createHash } from 'node:crypto'
import { ageMs, exists, put, remove } from '@/lib/r2'
import { readSheet } from '@/lib/courses'
import { parseMN, type SheetLang } from '@/lib/mn/parse'
import { renderSheetPdf } from './render'

/** bump when the print layout changes → every cached PDF is rebuilt */
export const PDF_VERSION = 'p4'

/**
 * R2 key of the clean (unstamped) PDF of one sheet version.
 * One-language sheets: one PDF (key does not depend on the site language).
 * Bilingual sheets (`lang: both`): one PDF per language.
 */
export type PdfMode = 'student' | 'doctor'
export const pdfKey = (sheetKey: string, lang: SheetLang | null = null, mode: PdfMode = 'student') =>
  `courses/pdf/${createHash('sha256').update(`${PDF_VERSION}|${sheetKey}|${mode}${lang ? `|${lang}` : ''}`).digest('hex').slice(0, 32)}.pdf`

/** null = one-language sheet · ['en','ar'] = bilingual */
async function sheetLangs(sheetKey: string): Promise<SheetLang[] | null> {
  const src = await readSheet(sheetKey).catch(() => null)
  return src && parseMN(src).bilingual ? ['en', 'ar'] : null
}

/**
 * Make sure the clean PDF of a sheet exists in R2 (renders it once).
 * `lang` matters only for bilingual sheets.
 */
export async function ensureSheetPdf(opts: { origin: string; sheetKey: string; footer: string; lang?: SheetLang; mode?: PdfMode }) {
  const langs = await sheetLangs(opts.sheetKey)
  const lang: SheetLang = langs ? opts.lang || 'en' : 'en'
  const mode: PdfMode = opts.mode === 'doctor' ? 'doctor' : 'student'
  const key = pdfKey(opts.sheetKey, langs ? lang : null, mode)
  if (await exists(key)) return key
  // many students may press "Download PDF" at the same moment (e.g. the night before an exam):
  // only ONE of them builds the PDF, the others wait for it instead of starting Chromium again.
  let job = building.get(key)
  if (!job) {
    job = buildOnce(key, { ...opts, lang, mode }).finally(() => building.delete(key))
    building.set(key, job)
  }
  return job
}

/** Thrown when another server is already building this PDF — the browser simply asks again a few seconds later. */
export class PdfPending extends Error {
  constructor() { super('PDF is being prepared') }
}

const building = new Map<string, Promise<string>>() // same server instance
const LOCK_MS = 75_000 // a build never takes longer (function limit 60 s) → older locks are stale

async function buildOnce(key: string, opts: { origin: string; sheetKey: string; footer: string; lang: SheetLang; mode: PdfMode }) {
  const lock = `${key}.lock`
  const lockAge = await ageMs(lock).catch(() => null)
  if (lockAge !== null && lockAge < LOCK_MS) {
    // another server instance is building it right now: wait a little for the result
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 1500))
      if (await exists(key)) return key
    }
    throw new PdfPending()
  }
  await put(lock, String(Date.now()), 'text/plain').catch(() => {})
  try {
    const pdf = await renderSheetPdf({ origin: opts.origin, key: opts.sheetKey, mode: opts.mode, lang: opts.lang, footer: opts.footer })
    await put(key, pdf, 'application/pdf')
    return key
  } finally {
    await remove(lock).catch(() => {})
  }
}

/** Background pre-build when the doctor saves/opens a sheet — every language the sheet has, so students never wait. */
export async function ensureSheetPdfs(opts: { origin: string; sheetKey: string; footer: string; doctorKey?: string | null }) {
  const langs = (await sheetLangs(opts.sheetKey)) || ['en' as const]
  for (const lang of langs) await ensureSheetPdf({ ...opts, lang })
  // the doctor's solved PDF (only the doctor can download it) — ready before he needs it
  if (opts.doctorKey) {
    const dl = (await sheetLangs(opts.doctorKey)) || ['en' as const]
    for (const lang of dl) await ensureSheetPdf({ ...opts, sheetKey: opts.doctorKey, lang, mode: 'doctor' })
  }
}
