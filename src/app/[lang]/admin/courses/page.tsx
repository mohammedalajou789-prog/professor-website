import CoursesAdmin from '@/components/admin/CoursesAdmin'
import { requireAdmin } from '@/lib/auth'
import { r2Configured } from '@/lib/r2'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Courses admin', robots: { index: false } }

export default async function AdminCourses() {
  const { supabase } = await requireAdmin()
  const [{ data: courses }, { data: students }] = await Promise.all([
    supabase.from('courses').select('*, lectures(count)').order('sort_order'),
    supabase.from('students').select('*').order('created_at', { ascending: false }),
  ])
  return <CoursesAdmin courses={courses || []} students={students || []} r2={r2Configured()} />
}
