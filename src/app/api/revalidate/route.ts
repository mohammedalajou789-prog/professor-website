import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getViewer } from '@/lib/auth'

/** Called by the admin dashboard after every save → public pages refresh. */
export async function POST() {
  const { isAdmin } = await getViewer()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  revalidateTag('site', { expire: 0 })
  revalidateTag('courses', { expire: 0 })
  return NextResponse.json({ ok: true })
}
