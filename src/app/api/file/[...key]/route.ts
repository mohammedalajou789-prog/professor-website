import { NextResponse } from 'next/server'
import { presign } from '@/lib/r2'

/** Public files (CV, news images): /api/file/public/... → short-lived signed R2 URL. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await params
  const key = parts.map(decodeURIComponent).join('/')
  if (!key.startsWith('public/') || key.includes('..')) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const name = key.split('/').pop()!.replace(/^[a-z0-9]+-/, '')
  const url = await presign(key, 'GET', 3600, { filename: name, inline: true })
  return NextResponse.redirect(url, { status: 302, headers: { 'cache-control': 'public, max-age=1800' } })
}
