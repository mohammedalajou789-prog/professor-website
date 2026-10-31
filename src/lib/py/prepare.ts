'use client'

import { parseMN, collectPy } from '@/lib/mn/parse'
import { runPy, scopeSvg } from './client'

/**
 * Before a sheet is saved/previewed: generate every ```pyplot figure that is not stored yet
 * (runs Python in this browser) and upload the SVGs. Throws with a readable list of Python errors.
 */
export async function prepareFigures(src: string, onProgress: (msg: string) => void) {
  const figs = collectPy(parseMN(src))
  if (!figs.length) return { total: 0, generated: 0 }
  const order = new Map<string, number>()
  figs.forEach((f, i) => { if (!order.has(f.hash)) order.set(f.hash, i + 1) })
  const unique = [...new Map(figs.map((f) => [f.hash, f])).values()]

  onProgress('Checking Python figures…')
  const r = await fetch(`/api/admin/pyfig?h=${unique.map((f) => f.hash).join(',')}`)
  const j = await r.json()
  if (!r.ok) throw new Error(j.error || 'Could not check figures')
  const have = new Set<string>(j.exists || [])
  const missing = unique.filter((f) => !have.has(f.hash))

  const errors: string[] = []
  for (let i = 0; i < missing.length; i++) {
    const f = missing[i]
    const tag = `Python figure ${i + 1}/${missing.length}`
    try {
      const raw = await runPy(f.code, (m) => onProgress(`${tag} — ${m}`))
      onProgress(`${tag} — saving…`)
      const put = await fetch('/api/admin/pyfig', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hash: f.hash, svg: scopeSvg(raw, f.hash) }) })
      if (!put.ok) throw new Error((await put.json().catch(() => ({}))).error || 'upload failed')
    } catch (e: any) {
      const first = f.code.split('\n').find((l) => l.trim() && !l.trim().startsWith('#')) || ''
      errors.push(`Figure #${order.get(f.hash)} (code starts: ${first.trim().slice(0, 60)})\n${e?.message || e}`)
    }
  }
  if (errors.length) throw new Error(`${errors.length} Python figure(s) failed — fix the code and try again:\n\n${errors.join('\n\n')}`)
  return { total: unique.length, generated: missing.length }
}
