import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Daily keep-alive (Vercel Cron, see vercel.json).
 * Public pages are served from cache, so in a quiet week (holidays) nothing touches the database —
 * and a free Supabase project is paused after 7 days without activity. One tiny read a day prevents that.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 })
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await db.from('courses').select('id', { head: true, count: 'exact' }).limit(1)
  return NextResponse.json({ ok: !error, at: new Date().toISOString() }, { status: error ? 500 : 200, headers: { 'cache-control': 'no-store' } })
}
