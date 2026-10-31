import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Student = { id: string; full_name: string; university_id: string; email: string; phone: string; status: string }

/** Current user + role, memoised per request. */
export const getViewer = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, isAdmin: false, student: null as Student | null }
  const [{ data: isAdmin }, { data: student }] = await Promise.all([
    supabase.rpc('is_admin'),
    supabase.from('students').select('*').eq('id', user.id).maybeSingle(),
  ])
  return { supabase, user, isAdmin: !!isAdmin, student: (student as Student) || null }
})

export async function requireAdmin() {
  const v = await getViewer()
  // local UI testing only (MOCK_DATA + ADMIN_PREVIEW are never set on Vercel)
  if (process.env.MOCK_DATA === '1' && process.env.ADMIN_PREVIEW === '1') return { ...v, isAdmin: true }
  if (!v.user) redirect('/admin/login')
  if (!v.isAdmin) redirect('/')
  return v
}

export async function requireStudentOrAdmin(next = '/dashboard') {
  const v = await getViewer()
  if (!v.user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return v
}
