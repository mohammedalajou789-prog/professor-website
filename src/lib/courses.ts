import 'server-only'
import { unstable_cache } from 'next/cache'
import { getViewer } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getText } from '@/lib/r2'

export type Course = {
  id: string; slug: string; code: string | null; name_en: string; name_ar: string | null
  description_en: string | null; description_ar: string | null; level: string | null; semester: string | null
  academic_year: string | null; accent: string | null; is_published: boolean; enrollment_open: boolean
  syllabus_en: string | null; syllabus_ar: string | null
}
export type Lecture = {
  id: string; course_id: string; number: number; title_en: string; title_ar: string | null
  summary_en: string | null; summary_ar: string | null; student_sheet_key: string | null; doctor_sheet_key: string | null
  show_student_sheet: boolean; show_doctor_sheet: boolean; is_published: boolean; sort_order: number; updated_at: string
}
export type CourseFile = { id: string; course_id: string; lecture_id: string | null; title_en: string; title_ar: string | null; kind: 'file' | 'link'; r2_key: string | null; url: string | null; mime: string | null; size_bytes: number | null; created_at: string }
export type Video = { id: string; lecture_id: string; youtube_id: string; title_en: string | null; title_ar: string | null; sort_order: number }

/**
 * Course + who is looking — ONE parallel round-trip (role check + course).
 * Courses are open to everyone (no approval): `access` is true for every published course
 * (RLS hides unpublished ones from everybody except the doctor).
 * `canDownload` = a signed-in, non-blocked account (files and PDFs need an account).
 */
export async function getCourseForViewer(slug: string) {
  const sb = await createClient()
  const [v, { data: course }] = await Promise.all([getViewer(), sb.from('courses').select('*').eq('slug', slug).maybeSingle()])
  const canDownload = v.isAdmin || (!!v.student && v.student.status === 'active')
  if (!course) return { ...v, course: null as Course | null, access: false, canDownload }
  return { ...v, course: course as Course, access: true, canDownload }
}

/** Sheet sources are immutable per key (every save writes a new key) → cache forever. */
export const readSheet = unstable_cache(
  async (key: string) => {
    // local UI testing only: built-in sample sheets (never stored in the database on the real site)
    if (key.startsWith('sample:') && (process.env.MOCK_DATA === '1' || process.env.MN_DEMO_PUBLIC === '1')) return (await import('@/lib/mn/samples')).SAMPLES[key.slice(7)]?.src ?? null
    return getText(key)
  },
  ['mn-sheet'],
  { revalidate: false }
)

export function ytId(input: string) {
  const s = input.trim()
  const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)
  return m ? m[1] : /^[\w-]{11}$/.test(s) ? s : null
}

export function fmtSize(n: number | null) {
  if (!n) return ''
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
