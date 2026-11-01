import 'server-only'
import { unstable_cache } from 'next/cache'
import { getText, r2Configured } from '@/lib/r2'
import { collectPy, type Doc } from './parse'

export const pyKey = (hash: string) => `courses/figs/${hash}.svg`
export const PY_HASH_RE = /^[0-9a-z]{16,30}$/

/** content-addressed → cache forever; a missing figure throws, so it is NOT cached and is retried next time */
const readFig = unstable_cache(
  async (hash: string) => {
    const svg = await getText(pyKey(hash))
    if (!svg) throw new Error('missing')
    return svg
  },
  ['mn-pyfig'],
  { revalidate: false }
)

/** Attach the generated SVG of every ```pyplot figure (null = not generated yet). */
export async function attachPy(doc: Doc) {
  const figs = collectPy(doc)
  if (!figs.length) return doc
  const ok = r2Configured()
  await Promise.all(figs.map(async (f) => {
    // course figures live in R2 (cached forever). The built-in example sheets ship their own
    // figures (≈1 MB) — that file is loaded ONLY when a figure is not in R2, so lecture pages
    // and PDFs never pay for it on a cold start.
    f.svg = ok && PY_HASH_RE.test(f.hash) ? await readFig(f.hash).catch(() => null) : null
    if (!f.svg) f.svg = (await import('./sample-figs')).SAMPLE_FIGS[f.hash] ?? null
  }))
  return doc
}

/** Defensive clean-up of an SVG produced by matplotlib before it is stored and inlined. */
export function sanitizeSvg(svg: string) {
  let s = svg.trim()
  if (!/^<svg[\s>]/.test(s) || !s.endsWith('</svg>')) return null
  s = s
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script[^>]*\/>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/<(iframe|object|embed|animate|set)\b[\s\S]*?(\/>|<\/\1\s*>)/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href\s*=\s*["'])\s*javascript:[^"']*/gi, '$1#')
    .replace(/(href\s*=\s*["'])\s*data:(?!image\/(png|jpeg);base64,)[^"']*/gi, '$1#')
    .replace(/(href\s*=\s*["'])\s*https?:[^"']*/gi, '$1#')
  return s
}
