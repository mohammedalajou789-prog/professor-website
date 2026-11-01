import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { getViewer } from '@/lib/auth'
import { exists, getBytes, presign, put, r2Configured } from '@/lib/r2'
import { renderSheetPdf } from '@/lib/pdf/render'
import { stampPdf } from '@/lib/pdf/stamp'
import { SAMPLES } from '@/lib/mn/samples'

export const maxDuration = 60
export const runtime = 'nodejs'

/** bump when the print layout changes → every cached PDF is rebuilt */
const PDF_VERSION = 'p2'

/**
 * Sheet → PDF (vector text, real fonts, same design as on screen, A4).
 *  1. access: same rules as the lecture page (RLS + "release" switches)
 *  2. the clean PDF is rendered once per sheet version and cached in R2
 *  3. students get their own copy stamped with their university ID (cached too)
 *  If the renderer is unavailable, the student is sent to the browser's print dialog instead.
 */
export async function GET(req: Request, { params }: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await params
  const url = new URL(req.url)
  // only the blank student sheet can ever be downloaded (solutions never leave the site as a file)
  const mode = 'student' as const
  const wantsJson = (req.headers.get('accept') || '').includes('application/json')
  const lang = url.searchParams.get('lang') === 'ar' ? 'ar' : 'en'

  // demo (local testing only): /api/sheet-pdf/demo?s=lecture1
  if (lectureId === 'demo' && process.env.MN_DEMO_PUBLIC === '1') {
    const s = url.searchParams.get('s') || 'lecture1'
    if (!SAMPLES[s]) return NextResponse.json({ error: 'no sample' }, { status: 404 })
    const pdf = await renderSheetPdf({ origin: url.origin, key: `sample:${s}`, mode, lang, footer: 'Prof. Ahmad El-Ajou — demo' })
    return new NextResponse(pdf as BodyInit, { headers: { 'content-type': 'application/pdf', 'content-disposition': `inline; filename="${s}-${mode}.pdf"` } })
  }

  const { supabase, user, isAdmin, student } = await getViewer()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))
  const { data: lec } = await supabase.from('lectures').select('id, number, title_en, course_id, student_sheet_key, doctor_sheet_key, show_student_sheet, show_doctor_sheet').eq('id', lectureId).maybeSingle()
  if (!lec) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 })
  const { data: course } = await supabase.from('courses').select('slug, name_en, code').eq('id', lec.course_id).maybeSingle()
  const allowed = isAdmin || lec.show_student_sheet
  const key = lec.student_sheet_key || lec.doctor_sheet_key
  if (!allowed || !key) return NextResponse.json({ error: 'This sheet is not available' }, { status: 403 })
  if (!r2Configured()) return NextResponse.json({ error: 'Storage is not configured' }, { status: 500 })

  const fileName = `${(course?.code || course?.name_en || 'course').replace(/[^\w\- ]+/g, '').trim()} - Lecture ${lec.number}.pdf`
  const base = `courses/pdf/${createHash('sha256').update(`${PDF_VERSION}|${key}|${mode}|${lang}`).digest('hex').slice(0, 32)}.pdf`
  let step = 'storage check'
  try {
    if (!(await exists(base))) {
      step = 'render'
      const pdf = await renderSheetPdf({
        origin: url.origin, key, mode, lang,
        footer: `${course?.name_en || ''} · Lecture ${lec.number} · Prof. Ahmad El-Ajou`,
      })
      step = 'save'
      await put(base, pdf, 'application/pdf')
    }
    let out = base
    if (!isAdmin && student) {
      step = 'watermark'
      out = `wm/${student.id}/sheet-${base.split('/').pop()}`
      if (!(await exists(out))) {
        const src = await getBytes(base)
        if (!src) throw new Error('pdf missing')
        await put(out, await stampPdf(src, student.university_id, student.email), 'application/pdf')
      }
    }
    step = 'link'
    const signed = await presign(out, 'GET', 300, { filename: fileName })
    if (wantsJson) return NextResponse.json({ url: signed }, { headers: { 'cache-control': 'no-store' } })
    return NextResponse.redirect(signed, { headers: { 'cache-control': 'no-store' } })
  } catch (e0: any) {
    console.error('[sheet-pdf]', step, e0)
    // the reason is shown in the toast (no secrets in it) so a failure can be fixed quickly
    return NextResponse.json({ error: 'PDF could not be created', step, detail: String(e0?.message || e0).slice(0, 300) }, { status: 500 })
  }
}
