import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'
import { exists, getBytes, presign, put, r2Configured } from '@/lib/r2'
import { renderSheetPdf } from '@/lib/pdf/render'
import { ensureSheetPdf, PdfPending } from '@/lib/pdf/build'
import { stampPdf } from '@/lib/pdf/stamp'
import { SAMPLES } from '@/lib/mn/samples'

export const maxDuration = 60
export const runtime = 'nodejs'


/**
 * Sheet → PDF (vector text, real fonts, same design as on screen, A4).
 *  1. a site account is needed (lectures are open to everyone, downloads are not)
 *  2. students: the blank student sheet only · the doctor: also the solved sheet (?v=doctor)
 *  3. the clean PDF is rendered once per sheet version and cached in R2
 *  4. students get their own copy stamped with their university ID (cached too)
 */
export async function GET(req: Request, { params }: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await params
  const url = new URL(req.url)
  // students: only the blank student sheet · the solved (doctor) sheet only for the doctor himself
  const mode = url.searchParams.get('v') === 'doctor' ? ('doctor' as const) : ('student' as const)
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
  if (!user) {
    if (wantsJson) return NextResponse.json({ error: 'login', login: true }, { status: 401 })
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (mode === 'doctor' && !isAdmin) return NextResponse.json({ error: 'Only the doctor can download the solved sheet' }, { status: 403 })
  if (!isAdmin && (!student || student.status !== 'active')) return NextResponse.json({ error: 'This account cannot download files' }, { status: 403 })
  const { data: lec } = await supabase.from('lectures').select('id, number, title_en, course_id, student_sheet_key, doctor_sheet_key, show_student_sheet, show_doctor_sheet').eq('id', lectureId).maybeSingle()
  if (!lec) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 })
  const { data: course } = await supabase.from('courses').select('slug, name_en, code').eq('id', lec.course_id).maybeSingle()
  const allowed = isAdmin || lec.show_student_sheet
  const key = mode === 'doctor' ? lec.doctor_sheet_key || lec.student_sheet_key : lec.student_sheet_key || lec.doctor_sheet_key
  if (!allowed || !key) return NextResponse.json({ error: 'This sheet is not available' }, { status: 403 })
  if (!r2Configured()) return NextResponse.json({ error: 'Storage is not configured' }, { status: 500 })

  const fileName = `${(course?.code || course?.name_en || 'course').replace(/[^\w\- ]+/g, '').trim()} - Lecture ${lec.number}${mode === 'doctor' ? ' (solved)' : ''}.pdf`
  let step = 'render'
  try {
    // normally already built when the doctor saved the sheet → no wait
    const base = await ensureSheetPdf({ origin: url.origin, sheetKey: key, lang, mode, footer: `${course?.name_en || ''} · Lecture ${lec.number} · Prof. Ahmad El-Ajou` })
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
    if (e0 instanceof PdfPending) {
      // being built for another student right now → the button retries automatically
      if (wantsJson) return NextResponse.json({ pending: true, retryAfter: 4 }, { status: 202, headers: { 'cache-control': 'no-store' } })
      return new NextResponse('The PDF is being prepared — please try again in a few seconds.', { status: 503, headers: { 'retry-after': '4', 'cache-control': 'no-store' } })
    }
    console.error('[sheet-pdf]', step, e0)
    // the reason is shown in the toast (no secrets in it) so a failure can be fixed quickly
    return NextResponse.json({ error: 'PDF could not be created', step, detail: String(e0?.message || e0).slice(0, 300) }, { status: 500 })
  }
}
