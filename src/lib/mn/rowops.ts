import { tex } from './render-inline'

/** ```rowops  — alternating matrix lines "[a b | c; d e | f]" and operation lines "R3+R2, R1-5R2" */
type M = { rows: string[][]; bar: number }

function splitEntries(row: string) {
  const out: string[] = []
  let cur = '', depth = 0
  for (const ch of row.trim()) {
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (/\s/.test(ch) && depth === 0) {
      if (cur) out.push(cur), (cur = '')
    } else cur += ch
  }
  if (cur) out.push(cur)
  return out
}

function parseMatrix(line: string): M {
  const inner = line.trim().replace(/^\[|\]$/g, '')
  let bar = -1
  const rows = inner.split(';').map((r) => {
    const parts = r.split('|')
    if (parts.length > 1) bar = splitEntries(parts[0]).length
    return splitEntries(parts.join(' '))
  })
  return { rows, bar }
}

const entry = (e: string) => {
  if (e.startsWith('{') && e.endsWith('}')) return e.slice(1, -1)
  const f = e.match(/^(-?)(\d+)\/(\d+)$/)
  if (f) return `${f[1]}\\tfrac{${f[2]}}{${f[3]}}`
  return e.replace(/^-/, '-')
}

const opTex = (op: string) =>
  op
    .trim()
    .replace(/R(\d+)/g, 'R_{$1}')
    .replace(/<->|↔/g, '\\leftrightarrow ')
    .replace(/(\d+)\/(\d+)/g, '\\tfrac{$1}{$2}')
    .replace(/->|→/g, '\\to ')

function matrixTex(m: M, changed: Set<number>) {
  const cols = m.rows[0]?.length || 1
  const spec = m.bar > 0 ? 'r'.repeat(m.bar) + '|' + 'r'.repeat(cols - m.bar) : 'r'.repeat(cols)
  const body = m.rows
    .map((r, i) => r.map((e) => (changed.has(i) ? `\\textcolor{#1F5FAD}{${entry(e)}}` : entry(e))).join(' & '))
    .join(' \\\\ ')
  return `\\left(\\begin{array}{${spec}}${body}\\end{array}\\right)`
}

export function renderRowOps(body: string): { html: string; count: number }[] {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean)
  const mats: M[] = []
  const ops: string[][] = []
  for (const l of lines) {
    if (l.startsWith('[')) mats.push(parseMatrix(l))
    else ops[mats.length - 1] = l.split(',').map(opTex)
  }
  const parts: { html: string; count: number }[] = []
  mats.forEach((m, k) => {
    const prev = mats[k - 1]
    const changed = new Set<number>()
    if (prev) m.rows.forEach((r, i) => r.join(' ') !== (prev.rows[i] || []).join(' ') && changed.add(i))
    let t = ''
    if (k > 0) {
      const o = ops[k - 1] || []
      const above = o[0] || ''
      const below = o.slice(1).join(',\\ ')
      t += `\\xrightarrow[${below}]{${above}}\\;`
    }
    t += matrixTex(m, changed)
    parts.push({ html: tex(t, true), count: k })
  })
  return parts
}
