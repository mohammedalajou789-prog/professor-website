'use client'

import React from 'react'
import { range as parseRange } from '@/lib/mn/expr'

export const COLORS: Record<string, string> = {
  blue: '#1F5FAD', red: '#C0392B', green: '#0E7C6B', gold: '#C9A227', navy: '#12233C', purple: '#7D3C98',
  orange: '#D35400', sky: '#12A4D9', gray: '#8C99A3', grey: '#8C99A3', black: '#111', teal: '#0E7C6B', pink: '#C2185B',
}
export const PALETTE = ['#1F5FAD', '#C0392B', '#0E7C6B', '#C9A227', '#7D3C98', '#D35400', '#12A4D9']
export const color = (c: string | undefined, i = 0) => (c ? COLORS[c] || c : PALETTE[i % PALETTE.length])

export type View = {
  W: number; H: number; pad: number
  x0: number; x1: number; y0: number; y1: number
  sx: (x: number) => number; sy: (y: number) => number
  ix: (px: number) => number; iy: (py: number) => number
}

export function makeView(attrs: Record<string, string>, defX: [number, number] = [-5, 5], defY?: [number, number], opts: { equal?: boolean; W?: number; H?: number } = {}): View {
  const [x0, x1] = parseRange(attrs.x, defX)
  let [y0, y1] = parseRange(attrs.y, defY || defX)
  const W = Number(attrs.width) || opts.W || 640
  const pad = 30
  let H = Number(attrs.height) || opts.H || 0
  if (!H) {
    if (attrs.aspect === 'equal' || opts.equal) H = Math.round(((W - 2 * pad) * (y1 - y0)) / (x1 - x0) + 2 * pad)
    else H = Math.round(W * 0.6)
  }
  H = Math.max(160, Math.min(H, 900))
  const sx = (x: number) => pad + ((x - x0) / (x1 - x0)) * (W - 2 * pad)
  const sy = (y: number) => H - pad - ((y - y0) / (y1 - y0)) * (H - 2 * pad)
  const ix = (px: number) => x0 + ((px - pad) / (W - 2 * pad)) * (x1 - x0)
  const iy = (py: number) => y0 + ((H - pad - py) / (H - 2 * pad)) * (y1 - y0)
  return { W, H, pad, x0, x1, y0, y1, sx, sy, ix, iy }
}

export function niceStep(span: number, target = 8) {
  const raw = span / target
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const m = raw / p
  return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p
}

const fmt = (v: number, pi = false) => {
  if (Math.abs(v) < 1e-9) return '0'
  if (pi) {
    const k = Math.round((v / Math.PI) * 2)
    if (k % 2 === 0) return `${k / 2 === 1 ? '' : k / 2 === -1 ? '−' : String(k / 2).replace('-', '−')}π`
    return `${k === 1 ? '' : k === -1 ? '−' : String(k).replace('-', '−')}π/2`
  }
  return String(+v.toFixed(4)).replace('-', '−')
}

export function Axes({ v, grid = true, axes = true, labels = true, xLabel = 'x', yLabel = 'y', piTicks = false }: { v: View; grid?: boolean; axes?: boolean; labels?: boolean; xLabel?: string; yLabel?: string; piTicks?: boolean }) {
  const sxStep = piTicks ? Math.PI / 2 : niceStep(v.x1 - v.x0)
  const syStep = niceStep(v.y1 - v.y0, 6)
  const xs: number[] = []
  for (let x = Math.ceil(v.x0 / sxStep) * sxStep; x <= v.x1 + 1e-9; x += sxStep) xs.push(+x.toFixed(10))
  const ys: number[] = []
  for (let y = Math.ceil(v.y0 / syStep) * syStep; y <= v.y1 + 1e-9; y += syStep) ys.push(+y.toFixed(10))
  const ax = Math.min(Math.max(0, v.y0), v.y1)
  const ay = Math.min(Math.max(0, v.x0), v.x1)
  return (
    <g className="mn-axes" fontFamily="var(--font-sheet), 'Times New Roman', serif" fontSize="12.5" fill="#4F6272">
      {grid && (
        <g stroke="#E7EEF5" strokeWidth="1">
          {xs.map((x) => <line key={'gx' + x} x1={v.sx(x)} x2={v.sx(x)} y1={v.sy(v.y0)} y2={v.sy(v.y1)} />)}
          {ys.map((y) => <line key={'gy' + y} y1={v.sy(y)} y2={v.sy(y)} x1={v.sx(v.x0)} x2={v.sx(v.x1)} />)}
        </g>
      )}
      {axes && (
        <g stroke="#4F6272" strokeWidth="1.1">
          <line x1={v.sx(v.x0)} x2={v.sx(v.x1) + 8} y1={v.sy(ax)} y2={v.sy(ax)} markerEnd="url(#mn-arrow-axis)" />
          <line x1={v.sx(ay)} x2={v.sx(ay)} y1={v.sy(v.y0)} y2={v.sy(v.y1) - 8} markerEnd="url(#mn-arrow-axis)" />
          {labels && xs.filter((x) => Math.abs(x - ay) > 1e-9).map((x) => <line key={'tx' + x} x1={v.sx(x)} x2={v.sx(x)} y1={v.sy(ax) - 3} y2={v.sy(ax) + 3} />)}
          {labels && ys.filter((y) => Math.abs(y - ax) > 1e-9).map((y) => <line key={'ty' + y} y1={v.sy(y)} y2={v.sy(y)} x1={v.sx(ay) - 3} x2={v.sx(ay) + 3} />)}
        </g>
      )}
      {axes && labels && (
        <g>
          {xs.filter((x) => Math.abs(x - ay) > 1e-9).map((x) => (
            <text key={'lx' + x} x={v.sx(x)} y={v.sy(ax) + 16} textAnchor="middle" stroke="#fff" strokeWidth="3" paintOrder="stroke">{fmt(x, piTicks)}</text>
          ))}
          {ys.filter((y) => Math.abs(y - ax) > 1e-9).map((y) => (
            <text key={'ly' + y} x={v.sx(ay) - 6} y={v.sy(y) + 4} textAnchor="end" stroke="#fff" strokeWidth="3" paintOrder="stroke">{fmt(y)}</text>
          ))}
          <text x={v.sx(v.x1) + 4} y={v.sy(ax) - 8} fontStyle="italic" fontSize="15" fill="#12233C">{xLabel}</text>
          <text x={v.sx(ay) + 8} y={v.sy(v.y1) - 2} fontStyle="italic" fontSize="15" fill="#12233C">{yLabel}</text>
        </g>
      )}
    </g>
  )
}

export function Defs() {
  return (
    <defs>
      <marker id="mn-arrow-axis" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill="#4F6272" />
      </marker>
      {Object.entries(COLORS).map(([k, c]) => (
        <marker key={k} id={`mn-arrow-${k}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={c} />
        </marker>
      ))}
    </defs>
  )
}
export const arrowId = (c: string | undefined, i = 0) => {
  const name = c && COLORS[c] ? c : Object.keys(COLORS).find((k) => COLORS[k] === color(c, i)) || 'blue'
  return `url(#mn-arrow-${name})`
}

/* ---------- mini math labels: "$\alpha_1 x^2$" → SVG tspans ---------- */
const GREEK: Record<string, string> = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  infty: '∞', cdot: '·', times: '×', pm: '±', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', to: '→', in: '∈', approx: '≈', partial: '∂', nabla: '∇', int: '∫', sum: 'Σ', sqrt: '√', cap: '∩', cup: '∪', emptyset: '∅',
  sin: 'sin', cos: 'cos', tan: 'tan', ln: 'ln', log: 'log', exp: 'exp',
}
export function mathText(s: string): string {
  return s
    .replace(/\$/g, '')
    .replace(/\\(mathbf|vb|boldsymbol|mathrm|text|vec|bar|hat)\{([^}]*)\}/g, '$2')
    // same commands without braces: "\mathbf c_1" → "c_1" (was shown as the word "mathbf")
    .replace(/\\(mathbf|vb|boldsymbol|mathrm|mathit|mathsf|text|vec|bar|hat|tilde|operatorname)\s*([A-Za-z0-9])/g, '$2')
    .replace(/\\[td]?frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\[td]?frac(\d)(\d)/g, '$1/$2')
    .replace(/\\sqrt\{([^}]*)\}/g, '√$1')
    .replace(/\\(left|right|,|;|!|quad|qquad)/g, '')
    .replace(/\\([A-Za-z]+)/g, (m, w) => GREEK[w] ?? w)
    .replace(/[{}]/g, (c) => c) // keep for script grouping
}
export function MathLabel({ text, x, y, anchor = 'start', size = 14, fill = '#12233C', bold }: { text: string; x: number; y: number; anchor?: 'start' | 'middle' | 'end'; size?: number; fill?: string; bold?: boolean }) {
  const s = mathText(text)
  const parts: { t: string; dy: 0 | 1 | -1 }[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if ((c === '^' || c === '_') && i + 1 < s.length) {
      let arg = ''
      if (s[i + 1] === '{') {
        const j = s.indexOf('}', i + 2)
        arg = s.slice(i + 2, j < 0 ? s.length : j)
        i = j < 0 ? s.length : j + 1
      } else {
        arg = s[i + 1]
        i += 2
      }
      parts.push({ t: arg, dy: c === '^' ? -1 : 1 })
    } else {
      let j = i
      while (j < s.length && s[j] !== '^' && s[j] !== '_') j++
      parts.push({ t: s.slice(i, j).replace(/[{}]/g, ''), dy: 0 })
      i = j
    }
  }
  const isMath = text.includes('$')
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill} fontStyle={isMath ? 'italic' : 'normal'} fontWeight={bold ? 700 : 400} fontFamily="var(--font-sheet), 'Times New Roman', serif" stroke="#fff" strokeWidth="3.5" paintOrder="stroke">
      {parts.map((p, k) => {
        const prev = parts[k - 1]
        const dy = p.dy === 0 ? (prev && prev.dy !== 0 ? -prev.dy * size * 0.35 : 0) : p.dy * size * 0.35 - (prev && prev.dy !== 0 ? prev.dy * size * 0.35 : 0)
        return (
          <tspan key={k} dy={dy || undefined} fontSize={p.dy ? size * 0.72 : undefined}>
            {p.t}
          </tspan>
        )
      })}
    </text>
  )
}

/** responsive SVG frame */
export function Frame({ v, children, label }: { v: { W: number; H: number }; children: React.ReactNode; label?: string }) {
  return (
    <svg viewBox={`0 0 ${v.W} ${v.H}`} className="mn-svg" role="img" aria-label={label || 'figure'} style={{ width: '100%', maxWidth: v.W, height: 'auto', overflow: 'visible' }}>
      <Defs />
      {children}
    </svg>
  )
}

/** animated path that draws itself when the figure is revealed */
export function DPath({ d, stroke, width = 2, dash, delay = 0, fill = 'none', opacity, marker, animate = true }: { d: string; stroke: string; width?: number; dash?: boolean; delay?: number; fill?: string; opacity?: number; marker?: string; animate?: boolean }) {
  if (!d) return null
  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      markerEnd={marker}
      pathLength={dash || !animate ? undefined : 1}
      strokeDasharray={dash ? '6 5' : undefined}
      className={dash || !animate ? 'mn-fade-in' : 'draw-path'}
      style={dash || !animate ? { animationDelay: `${delay}ms` } : { ['--len' as any]: 1, ['--d' as any]: `${delay}ms` }}
    />
  )
}

/** split a figure body into logical lines (supports ";" as separator, "#" comments) */
export function lines(body: string): string[] {
  return body
    .split('\n')
    .map((l) => l.replace(/\s+#.*$/, '').trim())
    .filter((l) => l && !l.startsWith('#'))
}

export function FigError({ msg }: { msg: string }) {
  return <div style={{ color: '#b00', background: '#fee', padding: 8, borderRadius: 6, fontSize: 13, fontFamily: 'monospace', textAlign: 'start' }}>Figure error: {msg}</div>
}

export function samplePath(f: (x: number) => number, v: View, a = v.x0, b = v.x1, n = 600) {
  let d = ''
  let pen = false
  const yr = (v.y1 - v.y0) * 4
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n
    const y = f(x)
    if (!isFinite(y) || y > v.y1 + yr || y < v.y0 - yr) {
      pen = false
      continue
    }
    const px = v.sx(x), py = Math.max(-2000, Math.min(2000, v.sy(y)))
    // break on vertical jumps (asymptotes)
    if (pen && i > 0) {
      const yp = f(a + ((b - a) * (i - 1)) / n)
      if (Math.abs(y - yp) > (v.y1 - v.y0) * 1.5) pen = false
    }
    d += `${pen ? 'L' : 'M'}${px.toFixed(2)} ${py.toFixed(2)}`
    pen = true
  }
  return d
}
