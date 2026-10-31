import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'
import { remove } from '@/lib/r2'

/** Admin: delete an object from R2 (used when a file/sheet is removed). */
export async function DELETE(req: Request) {
  const { isAdmin } = await getViewer()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const key = new URL(req.url).searchParams.get('key')
  if (!key || !/^(public|courses)\//.test(key)) return NextResponse.json({ error: 'bad key' }, { status: 400 })
  await remove(key)
  return NextResponse.json({ ok: true })
}
