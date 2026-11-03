import { notFound } from 'next/navigation'
import CourseEditor from '@/components/admin/CourseEditor'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edit course', robots: { index: false } }

export default async function EditCourse({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lecture?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const { supabase } = await requireAdmin()
  const { data: course } = await supabase.from('courses').select('*').eq('id', id).maybeSingle()
  if (!course) notFound()
  const [{ data: lectures }, { data: files }, { data: news }] = await Promise.all([
    supabase.from('lectures').select('*').eq('course_id', id).order('number'),
    supabase.from('course_files').select('*').eq('course_id', id).order('sort_order').order('created_at'),
    supabase.from('course_announcements').select('*').eq('course_id', id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
  ])
  const ids = (lectures || []).map((l) => l.id)
  const { data: videos } = ids.length ? await supabase.from('lecture_videos').select('*').in('lecture_id', ids).order('sort_order') : { data: [] }
  return <CourseEditor course={course} lectures={lectures || []} videos={videos || []} files={files || []} news={news || []} openLecture={sp.lecture} />
}
