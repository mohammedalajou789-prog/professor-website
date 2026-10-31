'use client'

import { compile, num, parseOpts } from '@/lib/mn/expr'
import { Axes, DPath, FigError, Frame, MathLabel, PALETTE, color, lines, makeView } from './core'

/* ═════════════ sign chart ═════════════ */
export function SignChart({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const ls = lines(body)
  let name = "f(x)", f: ((x: number) => number) | null = null
  let roots: number[] | null = null
  const factors: { label: string; g: (x: number) => number }[] = []
  const errors: string[] = []
  for (const l of ls) {
    let m: RegExpMatchArray | null
    try {
      if ((m = l.match(/^roots?\s+(.+)$/))) roots = m[1].split(/[\s,]+/).map((s) => num(s))
      else if ((m = l.match(/^factors?\s+(.+)$/))) {
        for (const fm of m[1].matchAll(/\(([^()]+)\)/g)) {
          const g = compile(fm[1], ['x'])
          factors.push({ label: fm[1], g: (x) => g({ x }) })
        }
      } else if ((m = l.match(/^(.+?)\s*=\s*(.+)$/))) {
        name = m[1].trim()
        const g = compile(m[2], ['x'])
        f = (x) => g({ x })
      }
    } catch (e: any) {
      errors.push(e.message)
    }
  }
  if (!f) return <FigError msg={errors.join('; ') || 'signchart needs f(x) = ...'} />
  if (!roots) {
    roots = []
    for (let x = -50; x < 50; x += 0.01) {
      const a = f(x), b = f(x + 0.01)
      if (a === 0 || a * b < 0) {
        const r = +(x + (a === 0 ? 0 : 0.005)).toFixed(2)
        if (!roots.length || Math.abs(roots[roots.length - 1] - r) > 0.02) roots.push(Math.round(r * 100) / 100)
      }
    }
  }
  roots.sort((a, b) => a - b)
  const pts = [-Infinity, ...roots, Infinity]
  const mids = pts.slice(0, -1).map((a, k) => {
    const b = pts[k + 1]
    return a === -Infinity ? (b === Infinity ? 0 : b - 1) : b === Infinity ? a + 1 : (a + b) / 2
  })
  const rows = [...factors.map((r) => ({ label: r.label, g: r.g })), { label: name, g: f }]
  const colW = 90, labW = 110
  const W = labW + colW * mids.length + 20
  const H = 34 + rows.length * 36
  const xAt = (k: number) => labW + colW * k
  return (
    <div className="mn-fig-box" style={{ overflowX: 'auto' }}>
      <Frame v={{ W, H }}>
        <g fontFamily="var(--font-sheet)" fontSize="15" fill="#12233C">
          <line x1={0} x2={W} y1={30} y2={30} stroke="#4F6272" />
          <line x1={labW - 8} x2={labW - 8} y1={0} y2={H} stroke="#4F6272" />
          <text x={8} y={21} fontStyle="italic">x</text>
          <text x={labW} y={21}>−∞</text>
          <text x={W - 26} y={21}>+∞</text>
          {roots.map((r, k) => <text key={k} x={xAt(k + 1)} y={21} textAnchor="middle">{String(+r.toFixed(3)).replace('-', '−')}</text>)}
          {rows.map((row, ri) => {
            const y = 30 + ri * 36 + 24
            return (
              <g key={ri}>
                <MathLabel text={`$${row.label}$`} x={8} y={y} size={14} />
                {ri < rows.length - 1 && <line x1={0} x2={W} y1={y + 12} y2={y + 12} stroke="#DCE3EE" />}
                {mids.map((mx, k) => {
                  const s = row.g(mx)
                  return (
                    <text key={k} x={xAt(k) + colW / 2} y={y + 1} textAnchor="middle" fontWeight="700" fontSize="19" fill={s > 0 ? '#0E7C6B' : '#C0392B'} className="mn-pop" style={{ animationDelay: `${300 + (ri * mids.length + k) * 90}ms` }}>
                      {s > 0 ? '+' : s < 0 ? '−' : '0'}
                    </text>
                  )
                })}
                {roots!.map((r, k) => (Math.abs(row.g(r)) < 1e-7 ? <text key={'z' + k} x={xAt(k + 1)} y={y} textAnchor="middle">0</text> : <line key={'z' + k} x1={xAt(k + 1)} x2={xAt(k + 1)} y1={y - 16} y2={y + 8} stroke="#C0392B" strokeWidth={1} strokeDasharray="2 3" />))}
              </g>
            )
          })}
        </g>
      </Frame>
    </div>
  )
}

/* ═════════════ variation table ═════════════ */
export function Variation({ body }: { attrs: Record<string, string>; body: string }) {
  const rows = lines(body).map((l) => {
    const i = l.indexOf(':')
    return { label: l.slice(0, i).trim(), cells: l.slice(i + 1).trim().split(/\s*\|\s*|\s+/).filter(Boolean) }
  })
  const xr = rows[0]
  if (!xr) return <FigError msg="variation needs rows" />
  const n = xr.cells.length
  const colW = 86, labW = 90
  const W = labW + colW * (n - 1) + 50
  const rowH = (r: { label: string }) => (/^f\(|^y$|^f$/.test(r.label) && !r.label.includes("'") ? 86 : 38)
  const H = rows.reduce((s, r) => s + rowH(r), 0) + 4
  const fmtv = (s: string) => s.replace('-inf', '−∞').replace('+inf', '+∞').replace(/^inf$/, '+∞').replace(/^-/, '−')
  let y = 0
  const out: React.ReactNode[] = []
  rows.forEach((r, ri) => {
    const h = rowH(r)
    const y0 = y
    out.push(<MathLabel key={'l' + ri} text={`$${r.label}$`} x={8} y={y0 + h / 2 + 5} size={15} />)
    if (ri) out.push(<line key={'hl' + ri} x1={0} x2={W} y1={y0} y2={y0} stroke="#4F6272" />)
    if (ri === 0) {
      xr.cells.forEach((c, k) => out.push(<text key={'x' + k} x={labW + k * colW} y={y0 + 25} textAnchor="middle" fontSize="15">{fmtv(c)}</text>))
    } else if (h < 50) {
      // sign row: alternating "+ 0 -" tokens between/at x-values
      r.cells.forEach((c, k) => {
        const pos = labW + (k / 2) * colW + (k % 2 === 0 ? colW / 2 : 0)
        const isAt = k % 2 === 1
        out.push(
          <text key={'s' + ri + k} x={isAt ? labW + ((k + 1) / 2) * colW : labW + (k / 2) * colW + colW / 2} y={y0 + 25} textAnchor="middle" fontSize={c === '0' ? 15 : 19} fontWeight={700} fill={c === '+' ? '#0E7C6B' : c === '-' ? '#C0392B' : '#12233C'} className="mn-pop" style={{ animationDelay: `${k * 120}ms` }}>
            {c === '-' ? '−' : c === '||' ? '‖' : c}
          </text>
        )
        void pos
      })
    } else {
      // f row: "up v down v up" → values at x positions, arrows between
      let xi = 0
      const pts: { x: number; y: number; v: string }[] = []
      const dirs: string[] = []
      let prevDir = ''
      r.cells.forEach((c) => {
        if (c === 'up' || c === 'down' || c === '↗' || c === '↘') {
          dirs.push(c === '↗' ? 'up' : c === '↘' ? 'down' : c)
          prevDir = dirs[dirs.length - 1]
          if (pts.length === xi) {
            // no explicit value at this x → infer level
            pts.push({ x: labW + xi * colW, y: prevDir === 'up' ? y0 + h - 14 : y0 + 18, v: '' })
          }
          xi++
        } else {
          const goingUp = prevDir === 'up'
          pts[xi] = { x: labW + xi * colW, y: prevDir ? (goingUp ? y0 + 18 : y0 + h - 14) : y0 + h / 2, v: fmtv(c) }
        }
      })
      // first value: place opposite to first arrow
      if (pts[0] && dirs[0]) pts[0].y = dirs[0] === 'up' ? y0 + h - 14 : y0 + 18
      pts.forEach((p, k) => p.v && out.push(<text key={'v' + k} x={p.x} y={p.y + 5} textAnchor="middle" fontSize="15" className="mn-pop" style={{ animationDelay: `${k * 260}ms` }}>{p.v}</text>))
      dirs.forEach((d, k) => {
        const a = pts[k], b = pts[k + 1] || { x: labW + (k + 1) * colW, y: d === 'up' ? y0 + 18 : y0 + h - 14 }
        const ay = d === 'up' ? y0 + h - 22 : y0 + 26, by = d === 'up' ? y0 + 26 : y0 + h - 22
        out.push(<DPath key={'a' + k} d={`M${a.x + 16} ${ay}L${b.x - 16} ${by}`} stroke={d === 'up' ? '#0E7C6B' : '#C0392B'} width={1.8} marker={`url(#mn-arrow-${d === 'up' ? 'green' : 'red'})`} delay={200 + k * 260} />)
      })
    }
    y += h
  })
  return (
    <div className="mn-fig-box" style={{ overflowX: 'auto' }}>
      <Frame v={{ W, H }}>
        <g fontFamily="var(--font-sheet)" fill="#12233C">
          <rect x={0.5} y={0.5} width={W - 1} height={H - 1} fill="none" stroke="#4F6272" />
          <line x1={labW - 40} x2={labW - 40} y1={0} y2={H} stroke="#4F6272" />
          {out}
        </g>
      </Frame>
    </div>
  )
}

/* ═════════════ statistics ═════════════ */
const arr = (s?: string) => (s ? s.replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean) : [])
const nums = (s?: string) => arr(s).map((x) => num(x))

function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return x >= 0 ? y : -y
}

export function Stats({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const charts = lines(body).map((l) => {
    const m = l.match(/^(\w+)\s*(.*)$/)!
    return { kind: m[1], ...parseOpts(m[2]) }
  })
  return (
    <div className="mn-fig-box" style={{ display: 'grid', gap: 14 }}>
      {charts.map((c, k) => (
        <StatChart key={k} kind={c.kind} o={c.opts} rest={c.rest} attrs={attrs} />
      ))}
    </div>
  )
}

function StatChart({ kind, o, rest, attrs }: { kind: string; o: Record<string, string>; rest: string; attrs: Record<string, string> }) {
  const W = 620, H = 300
  if (kind === 'pie') {
    const vals = nums(o.values), labs = arr(o.labels)
    const tot = vals.reduce((a, b) => a + b, 0) || 1
    let a0 = -Math.PI / 2
    const R = 110, cx = W / 2, cy = H / 2
    return (
      <Frame v={{ W, H }}>
        {vals.map((v, k) => {
          const a1 = a0 + (2 * Math.PI * v) / tot
          const big = a1 - a0 > Math.PI ? 1 : 0
          const d = `M${cx} ${cy}L${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)}A${R} ${R} 0 ${big} 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}Z`
          const mid = (a0 + a1) / 2
          const el = (
            <g key={k} className="mn-pop" style={{ animationDelay: `${k * 150}ms`, transformOrigin: `${cx}px ${cy}px` }}>
              <path d={d} fill={PALETTE[k % PALETTE.length]} stroke="#fff" strokeWidth={2} />
              <MathLabel text={`${labs[k] || ''} (${Math.round((100 * v) / tot)}%)`} x={cx + (R + 26) * Math.cos(mid)} y={cy + (R + 26) * Math.sin(mid) + 4} anchor={Math.cos(mid) > 0.2 ? 'start' : Math.cos(mid) < -0.2 ? 'end' : 'middle'} size={13} />
            </g>
          )
          a0 = a1
          return el
        })}
      </Frame>
    )
  }
  if (kind === 'normal') {
    const mu = num(o.mean, 0), sd = num(o.sd, 1)
    const v = makeView({ ...attrs, x: `[${mu - 4 * sd},${mu + 4 * sd}]`, y: `[0,${(1.15 / (sd * Math.sqrt(2 * Math.PI))).toFixed(4)}]` })
    const pdf = (x: number) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI))
    let shade: React.ReactNode = null
    let prob = ''
    const sh = rest.match(/from\s+(\S+)\s+to\s+(\S+)/)
    if (sh) {
      const a = String(sh[1]).includes('inf') ? mu - 4 * sd : num(String(sh[1])), b = String(sh[2]).includes('inf') ? mu + 4 * sd : num(String(sh[2]))
      let d = `M${v.sx(a)} ${v.sy(0)}`
      for (let k = 0; k <= 120; k++) {
        const x = a + ((b - a) * k) / 120
        d += `L${v.sx(x)} ${v.sy(pdf(x))}`
      }
      d += `L${v.sx(b)} ${v.sy(0)}Z`
      const p = 0.5 * (erf((b - mu) / (sd * Math.SQRT2)) - erf((a - mu) / (sd * Math.SQRT2)))
      prob = `P(${+a.toFixed(3)} < X < ${+b.toFixed(3)}) ≈ ${p.toFixed(4)}`
      shade = <path d={d} fill="#C9A227" opacity={0.35} className="mn-fade-in" style={{ animationDelay: '1.2s' }} />
    }
    return (
      <Frame v={v}>
        <Axes v={v} grid={false} yLabel="" />
        {shade}
        <DPath d={Array.from({ length: 301 }, (_, k) => { const x = v.x0 + ((v.x1 - v.x0) * k) / 300; return `${k ? 'L' : 'M'}${v.sx(x)} ${v.sy(pdf(x))}` }).join('')} stroke="#1F5FAD" width={2.4} />
        {prob && <MathLabel text={prob} x={v.W - v.pad} y={v.pad + 6} anchor="end" size={14} fill="#0B6FA4" />}
      </Frame>
    )
  }
  if (kind === 'scatter' || kind === 'line') {
    const pts = [...(o.data || '').matchAll(/\(\s*([^,]+)\s*,\s*([^)]+)\)/g)].map((m) => [num(m[1]), num(m[2])] as [number, number])
    if (!pts.length) return <FigError msg="scatter needs data=[(x,y),...]" />
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
    const pad = (a: number, b: number) => [a - (b - a) * 0.12 - 0.5, b + (b - a) * 0.12 + 0.5]
    const [xa, xb] = pad(Math.min(...xs), Math.max(...xs)), [ya, yb] = pad(Math.min(...ys), Math.max(...ys))
    const v = makeView({ x: `[${xa},${xb}]`, y: `[${Math.min(0, ya)},${yb}]` })
    let reg: React.ReactNode = null
    if (o.regression === 'linear' || kind === 'scatter' && o.regression) {
      const n = pts.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n
      const sxy = pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0), sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0), syy = ys.reduce((s, y) => s + (y - my) ** 2, 0)
      const b1 = sxy / sxx, b0 = my - b1 * mx, r = sxy / Math.sqrt(sxx * syy)
      reg = (
        <>
          <DPath d={`M${v.sx(xa)} ${v.sy(b0 + b1 * xa)}L${v.sx(xb)} ${v.sy(b0 + b1 * xb)}`} stroke="#C0392B" width={2} delay={900} />
          <MathLabel text={`ŷ = ${b0.toFixed(3)} + ${b1.toFixed(3)}x,  r = ${r.toFixed(3)}`} x={v.W - v.pad} y={v.pad + 6} anchor="end" size={14} fill="#C0392B" />
        </>
      )
    }
    return (
      <Frame v={v}>
        <Axes v={v} />
        {kind === 'line' && <DPath d={pts.map((p, k) => `${k ? 'L' : 'M'}${v.sx(p[0])} ${v.sy(p[1])}`).join('')} stroke="#1F5FAD" width={2} />}
        {pts.map((p, k) => <circle key={k} cx={v.sx(p[0])} cy={v.sy(p[1])} r={4.5} fill="#1F5FAD" fillOpacity={0.85} className="mn-pop" style={{ animationDelay: `${k * 60}ms` }} />)}
        {reg}
      </Frame>
    )
  }
  if (kind === 'boxplot') {
    const d = nums(o.data).sort((a, b) => a - b)
    if (!d.length) return <FigError msg="boxplot needs data=[...]" />
    const q = (p: number) => {
      const i = (d.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i)
      return d[lo] + (d[hi] - d[lo]) * (i - lo)
    }
    const [mn, q1, md, q3, mx] = [d[0], q(0.25), q(0.5), q(0.75), d[d.length - 1]]
    const span = mx - mn || 1
    const v = makeView({ x: `[${mn - span * 0.1},${mx + span * 0.1}]`, y: '[0,2]' }, undefined, undefined, { H: 170 })
    const y = v.sy(1), h = 50
    return (
      <Frame v={v}>
        <Axes v={v} grid={false} labels yLabel="" />
        <g className="mn-fade-in">
          <line x1={v.sx(mn)} x2={v.sx(q1)} y1={y} y2={y} stroke="#12233C" strokeWidth={1.5} />
          <line x1={v.sx(q3)} x2={v.sx(mx)} y1={y} y2={y} stroke="#12233C" strokeWidth={1.5} />
          <rect x={v.sx(q1)} y={y - h / 2} width={v.sx(q3) - v.sx(q1)} height={h} fill="#1F5FAD" fillOpacity={0.15} stroke="#1F5FAD" strokeWidth={2} />
          <line x1={v.sx(md)} x2={v.sx(md)} y1={y - h / 2} y2={y + h / 2} stroke="#C0392B" strokeWidth={2.5} />
          {[mn, mx].map((x) => <line key={x} x1={v.sx(x)} x2={v.sx(x)} y1={y - 12} y2={y + 12} stroke="#12233C" strokeWidth={1.5} />)}
        </g>
        <MathLabel text={`min ${mn} · Q₁ ${+q1.toFixed(2)} · median ${+md.toFixed(2)} · Q₃ ${+q3.toFixed(2)} · max ${mx}`} x={v.W / 2} y={v.pad} anchor="middle" size={13} fill="#4F6272" />
      </Frame>
    )
  }
  // histogram / bar
  let labels: string[] = [], vals: number[] = []
  if (kind === 'histogram') {
    const d = nums(o.data)
    const bins = Math.max(1, num(o.bins, Math.ceil(Math.sqrt(d.length))))
    const lo = Math.min(...d), hi = Math.max(...d), w = (hi - lo) / bins || 1
    vals = Array(bins).fill(0)
    d.forEach((x) => vals[Math.min(bins - 1, Math.floor((x - lo) / w))]++)
    labels = vals.map((_, k) => `${+(lo + k * w).toFixed(2)}–${+(lo + (k + 1) * w).toFixed(2)}`)
  } else {
    vals = nums(o.values)
    labels = arr(o.labels)
  }
  const max = Math.max(1, ...vals)
  const pad = 36, bw = (W - 2 * pad) / Math.max(1, vals.length)
  return (
    <Frame v={{ W, H }}>
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="#4F6272" />
      {vals.map((v, k) => {
        const h = ((H - 2 * pad - 10) * v) / max
        return (
          <g key={k}>
            <rect x={pad + k * bw + (kind === 'histogram' ? 0.5 : bw * 0.15)} y={H - pad - h} width={kind === 'histogram' ? bw - 1 : bw * 0.7} height={h} fill={kind === 'histogram' ? '#1F5FAD' : PALETTE[k % PALETTE.length]} fillOpacity={0.85} style={{ transformOrigin: `0 ${H - pad}px`, animation: `bar-grow .9s var(--ease-out) ${k * 80}ms both` }} className="anim" />
            <text x={pad + k * bw + bw / 2} y={H - pad - h - 6} textAnchor="middle" fontSize="12.5" fill="#12233C">{v}</text>
            <text x={pad + k * bw + bw / 2} y={H - pad + 16} textAnchor="middle" fontSize="11.5" fill="#4F6272">{labels[k]}</text>
          </g>
        )
      })}
    </Frame>
  )
}
