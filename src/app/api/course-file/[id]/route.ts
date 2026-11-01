import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'
import { exists, getBytes, presign, put } from '@/lib/r2'
import { stampPdf } from '@/lib/pdf/stamp'

export const maxDuration = 60

/**
 * Course file download.
 *  - access is checked by Supabase RLS (only admins or approved students see the row)
 *  - PDFs for students are stamped with the student's university ID (cached per student in R2)
 *  - the browser is redirected to a 5-minute signed R2 URL
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user, isAdmin, student } = await getViewer()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const { data: file } = await supabase.from('course_files').select('*').eq('id', id).maybeSingle()
  if (!file) return NextResponse.json({ error: 'Not found or no access' }, { status: 404 })
  if (file.kind === 'link' && file.url) return NextResponse.redirect(file.url)
  if (!file.r2_key) return NextResponse.json({ error: 'File missing' }, { status: 404 })

  const inline = new URL(req.url).searchParams.get('view') === '1'
  const niceName = (file.title_en || 'file').replace(/[^\w.\- ]+/g, '').trim() + (file.r2_key.match(/\.[a-z0-9]+$/i)?.[0] || '')
  const isPdf = /\.pdf$/i.test(file.r2_key) || file.mime === 'application/pdf'

  if (!isAdmin && student && isPdf && file.watermark) {
    const wmKey = `wm/${student.id}/${file.id}-${file.r2_key.split('/').pop()}`
    if (!(await exists(wmKey))) {
      const src = await getBytes(file.r2_key)
      if (!src) return NextResponse.json({ error: 'File missing' }, { status: 404 })
      const stamped = await stampPdf(src, student.university_id, student.email)
      await put(wmKey, stamped, 'application/pdf')
    }
    return NextResponse.redirect(await presign(wmKey, 'GET', 300, { filename: niceName, inline }), { headers: { 'cache-control': 'no-store' } })
  }

  return NextResponse.redirect(await presign(file.r2_key, 'GET', 300, { filename: niceName, inline }), { headers: { 'cache-control': 'no-store' } })
}
