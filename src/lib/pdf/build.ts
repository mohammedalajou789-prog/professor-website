import 'server-only'
import { createHash } from 'node:crypto'
import { exists, put } from '@/lib/r2'
import { renderSheetPdf } from './render'

/** bump when the print layout changes → every cached PDF is rebuilt */
export const PDF_VERSION = 'p3'

/** R2 key of the clean (unstamped) PDF of one sheet version */
export const pdfKey = (sheetKey: string) => `courses/pdf/${createHash('sha256').update(`${PDF_VERSION}|${sheetKey}|student`).digest('hex').slice(0, 32)}.pdf`

/**
 * Make sure the clean PDF of a sheet exists in R2 (renders it once).
 * Called in the background when the doctor saves a sheet, so students never wait for the render.
 */
export async function ensureSheetPdf(opts: { origin: string; sheetKey: string; footer: string }) {
  const key = pdfKey(opts.sheetKey)
  if (await exists(key)) return key
  const pdf = await renderSheetPdf({ origin: opts.origin, key: opts.sheetKey, mode: 'student', lang: 'en', footer: opts.footer })
  await put(key, pdf, 'application/pdf')
  return key
}
