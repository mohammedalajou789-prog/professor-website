import { NextResponse } from 'next/server'
import { getViewer } from '@/lib/auth'
import { exists, put, r2Configured } from '@/lib/r2'
import { PY_HASH_RE, pyKey, sanitizeSvg } from '@/lib/mn/pyfigs'

/** Admin: which Python figures already exist in R2 (?h=hash1,hash2) */
export async function GET(req: Request) {
  const { isAdmin } = await getViewer()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!r2Configured()) return NextResponse.json({ error: 'Cloudflare R2 is not configured yet (see CHANGES.md).' }, { status: 500 })
  const hashes = (new URL(req.url).searchParams.get('h') || '').split(',').filter((h) => PY_HASH_RE.test(h)).slice(0, 200)
  const found = await Promise.all(hashes.map(async (h) => ((await exists(pyKey(h)).catch(() => false)) ? h : null)))
  return NextResponse.json({ exists: found.filter(Boolean) })
}

/** Admin: store one generated figure (content-addressed by the hash of its code). */
export async function PUT(req: Request) {
  const { isAdmin } = await getViewer()
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!r2Configured()) return NextResponse.json({ error: 'Cloudflare R2 is not configured yet (see CHANGES.md).' }, { status: 500 })
  const { hash, svg } = await req.json().catch(() => ({}))
  if (typeof hash !== 'string' || !PY_HASH_RE.test(hash) || typeof svg !== 'string') return NextResponse.json({ error: 'bad request' }, { status: 400 })
  if (svg.length > 4_000_000) return NextResponse.json({ error: 'Figure too large (over 4 MB). Use fewer points.' }, { status: 400 })
  const clean = sanitizeSvg(svg)
  if (!clean) return NextResponse.json({ error: 'not an SVG' }, { status: 400 })
  await put(pyKey(hash), clean, 'image/svg+xml; charset=utf-8')
  return NextResponse.json({ ok: true })
}
