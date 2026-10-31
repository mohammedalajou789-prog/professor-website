import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'
import { presign, r2Configured, safeName } from '@/lib/r2'

const MAX = 200 * 1024 * 1024 // 200 MB

export async function POST(req: Request) {
  const { isAdmin } = await getViewer()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!r2Configured()) return NextResponse.json({ error: 'Cloudflare R2 is not configured yet (see CHANGES.md).' }, { status: 500 })
  const { folder, filename, size } = await req.json()
  if (typeof folder !== 'string' || !/^(public|courses)(\/[\w.-]+)*$/.test(folder)) return NextResponse.json({ error: 'bad folder' }, { status: 400 })
  if (size > MAX) return NextResponse.json({ error: 'File too large (max 200 MB)' }, { status: 400 })
  const key = `${folder}/${Date.now().toString(36)}-${safeName(String(filename || 'file'))}`
  const uploadUrl = await presign(key, 'PUT', 900)
  return NextResponse.json({ key, uploadUrl, publicUrl: key.startsWith('public/') ? `/api/file/${key}` : null })
}
