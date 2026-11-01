import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'

/** Who is signed in — only used by the top bar to pick its button (also refreshes the role hint cookie). */
export async function GET() {
  const { user, isAdmin } = await getViewer()
  const role = user ? (isAdmin ? 'admin' : 'student') : null
  const res = NextResponse.json({ role }, { headers: { 'cache-control': 'no-store' } })
  if (role) res.cookies.set('site-role', role, { path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
  else res.cookies.set('site-role', '', { path: '/', maxAge: 0 })
  return res
}
