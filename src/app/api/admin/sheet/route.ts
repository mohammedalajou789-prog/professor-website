import { NextResponse, after } from 'next/server'
import { ensureSheetPdf } from '@/lib/pdf/build'

export const maxDuration = 60
import { getViewer } from '@/lib/auth'
import { put, getText, r2Configured } from '@/lib/r2'

/** Admin: save / load the MN source of a lecture sheet (stored in R2). */
export async function PUT(req: Request) {
  const { isAdmin, supabase } = await getViewer()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!r2Configured()) return NextResponse.json({ error: 'Cloudflare R2 is not configured yet (see CHANGES.md).' }, { status: 500 })
  const { lectureId, which, text, draft } = await req.json()
  if (!lectureId || !['student', 'doctor'].includes(which) || typeof text !== 'string') return NextResponse.json({ error: 'bad request' }, { status: 400 })
  if (text.length > 2_000_000) return NextResponse.json({ error: 'Sheet too large' }, { status: 400 })
  const { data: lec } = await supabase.from('lectures').select('id, course_id, number, student_sheet_key, courses(name_en)').eq('id', lectureId).maybeSingle()
  if (!lec) return NextResponse.json({ error: 'lecture not found' }, { status: 404 })
  if (draft) {
    // preview only: overwrite a draft object, do not touch the lecture
    const dkey = `courses/drafts/${lec.id}-${which}-${Date.now().toString(36)}.mn`
    await put(dkey, text, 'text/plain; charset=utf-8')
    return NextResponse.json({ ok: true, key: dkey })
  }
  const key = `courses/${lec.course_id}/lectures/${lec.id}/${which}-${Date.now().toString(36)}.mn`
  await put(key, text, 'text/plain; charset=utf-8')
  const col = which === 'student' ? 'student_sheet_key' : 'doctor_sheet_key'
  const { error } = await supabase.from('lectures').update({ [col]: key }).eq('id', lec.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // prepare the students' PDF in the background (the save itself returns immediately)
  const pdfSource = which === 'student' ? key : lec.student_sheet_key ? null : key
  if (pdfSource) {
    const origin = new URL(req.url).origin
    const footer = `${(lec as any).courses?.name_en || ''} · Lecture ${lec.number} · Prof. Ahmad El-Ajou`
    after(() => ensureSheetPdf({ origin, sheetKey: pdfSource, footer }).catch((e) => console.error('[sheet-pdf prebuild]', e)))
  }
  return NextResponse.json({ ok: true, key })
}

export async function GET(req: Request) {
  const { isAdmin } = await getViewer()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const key = new URL(req.url).searchParams.get('key')
  if (!key || !key.startsWith('courses/')) return NextResponse.json({ error: 'bad key' }, { status: 400 })
  const text = await getText(key)
  return new NextResponse(text ?? '', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } })
}
