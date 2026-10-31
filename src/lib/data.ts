import 'server-only'
import { unstable_cache } from 'next/cache'
import { createClient as createSupabase } from '@supabase/supabase-js'

/**
 * Public, cookie-less Supabase client for cached reads of public tables.
 * Results are cached on the server (tag "site") and refreshed:
 *   - automatically every hour, and
 *   - immediately when the admin saves anything (POST /api/revalidate).
 */
function publicDb() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

const CACHE = { tags: ['site'], revalidate: 3600 }
const MOCK = process.env.MOCK_DATA === '1'

async function rows<T = any>(table: string, order?: { col: string; asc?: boolean }[]): Promise<T[]> {
  if (MOCK) {
    const m = await import('./mock')
    if (table === 'publications') return m.mockPubs as T[]
    if (table === 'research_interests') return m.mockInterests as T[]
  }
  try {
    let q: any = publicDb().from(table).select('*')
    for (const o of order || []) q = q.order(o.col, { ascending: o.asc ?? true })
    const { data, error } = await q
    if (error) throw error
    return (data || []) as T[]
  } catch (e: any) {
    console.error(`[data] ${table}:`, e?.message || e)
    return []
  }
}

export const getProfile = unstable_cache(
  async () => {
    try {
      const { data } = await publicDb().from('profile').select('*').limit(1).maybeSingle()
      return (data || null) as Record<string, any> | null
    } catch {
      return null
    }
  },
  ['profile'],
  CACHE
)

export const getPublications = unstable_cache(
  async () =>
    rows('publications', [
      { col: 'year', asc: false },
      { col: 'created_at', asc: false },
    ]),
  ['publications'],
  CACHE
)

export const getInterests = unstable_cache(async () => rows('research_interests', [{ col: 'sort_order' }]), ['interests'], CACHE)

export const getNews = unstable_cache(
  async () => {
    try {
      const { data } = await publicDb().from('news_activities').select('*').order('activity_date', { ascending: false }).limit(4)
      return data || []
    } catch {
      return []
    }
  },
  ['news'],
  CACHE
)

export const getAbout = unstable_cache(
  async () => {
    const [education, positions, awards, memberships, committees, conferences, supervision] = await Promise.all([
      rows('education', [{ col: 'sort_order' }]),
      rows('positions', [{ col: 'sort_order' }]),
      rows('awards', [{ col: 'sort_order' }]),
      rows('memberships', [{ col: 'sort_order' }]),
      rows('committees', [{ col: 'sort_order' }]),
      rows('conferences', [{ col: 'year', asc: false }]),
      rows('supervision', [{ col: 'sort_order' }]),
    ])
    return { education, positions, awards, memberships, committees, conferences, supervision }
  },
  ['about'],
  CACHE
)

/** Public course catalogue (published courses only — enforced by RLS too). */
export const getPublicCourses = unstable_cache(
  async () => {
    if (MOCK) return (await import('./mock')).mockCourses
    try {
    const { data, error } = await publicDb()
      .from('courses')
      .select('id, slug, code, name_en, name_ar, description_en, description_ar, level, semester, academic_year, accent, sort_order, enrollment_open')
      .eq('is_published', true)
      .order('sort_order')
    if (error) return []
    return data || []
    } catch {
      return []
    }
  },
  ['courses-public'],
  { tags: ['site', 'courses'], revalidate: 600 }
)
