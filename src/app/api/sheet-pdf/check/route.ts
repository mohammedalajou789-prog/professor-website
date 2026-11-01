import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'
import { renderSheetPdf } from '@/lib/pdf/render'

export const maxDuration = 60
export const runtime = 'nodejs'

/** Admin diagnostic: builds a PDF of a built-in sample sheet and reports how long it took. Open /api/sheet-pdf/check */
export async function GET(req: Request) {
  const { isAdmin } = await getViewer()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const t0 = Date.now()
  try {
    const pdf = await renderSheetPdf({ origin: new URL(req.url).origin, key: 'sample:lecture1', mode: 'student', lang: 'en', footer: 'PDF check' })
    return NextResponse.json({ ok: true, bytes: pdf.length, ms: Date.now() - t0 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e), ms: Date.now() - t0 }, { status: 500 })
  }
}
