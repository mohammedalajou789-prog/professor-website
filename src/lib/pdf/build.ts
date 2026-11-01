import 'server-only'
import { createHash } from 'node:crypto'
import { exists, put } from '@/lib/r2'
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
export const pdfKey = (sheetKey: string, lang: SheetLang | null = null) =>
  `courses/pdf/${createHash('sha256').update(`${PDF_VERSION}|${sheetKey}|student${lang ? `|${lang}` : ''}`).digest('hex').slice(0, 32)}.pdf`

/** null = one-language sheet · ['en','ar'] = bilingual */
async function sheetLangs(sheetKey: string): Promise<SheetLang[] | null> {
  const src = await readSheet(sheetKey).catch(() => null)
  return src && parseMN(src).bilingual ? ['en', 'ar'] : null
}

/**
 * Make sure the clean PDF of a sheet exists in R2 (renders it once).
 * `lang` matters only for bilingual sheets.
 */
export async function ensureSheetPdf(opts: { origin: string; sheetKey: string; footer: string; lang?: SheetLang }) {
  const langs = await sheetLangs(opts.sheetKey)
  const lang: SheetLang = langs ? opts.lang || 'en' : 'en'
  const key = pdfKey(opts.sheetKey, langs ? lang : null)
  if (await exists(key)) return key
  const pdf = await renderSheetPdf({ origin: opts.origin, key: opts.sheetKey, mode: 'student', lang, footer: opts.footer })
  await put(key, pdf, 'application/pdf')
  return key
}

/** Background pre-build when the doctor saves/opens a sheet — every language the sheet has, so students never wait. */
export async function ensureSheetPdfs(opts: { origin: string; sheetKey: string; footer: string }) {
  const langs = (await sheetLangs(opts.sheetKey)) || ['en' as const]
  for (const lang of langs) await ensureSheetPdf({ ...opts, lang })
}
