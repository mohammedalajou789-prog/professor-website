'use client'

import { useMemo } from 'react'
import { num, parseOpts, range } from '@/lib/mn/expr'
import { Axes, DPath, FigError, Frame, MathLabel, arrowId, color, lines, makeView } from './core'

/* ═════════════ number line ═════════════ */
export function NumberLine({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const [a, b] = range(attrs.range || attrs.x, [-5, 5])
  const W = 640, H = 96, pad = 34, y = 52
  const sx = (x: number) => pad + ((x - a) / (b - a)) * (W - 2 * pad)
  const els: React.ReactNode[] = []
  const errors: string[] = []
  let lane = 0
  for (const raw of lines(body)) {
    const { opts: o, rest } = parseOpts(raw)
    let m: RegExpMatchArray | null
    try {
      if ((m = rest.match(/^interval\s*([\[(])\s*([^,]+?)\s*,\s*([^\])]+?)\s*([\])])$/))) {
        const lo = m[2].includes('inf') ? a - 1 : num(m[2]), hi = m[3].includes('inf') ? b + 1 : num(m[3])
        const c = color(o.color || 'blue', lane)
        const yy = y - 10 - lane * 9
        const L = Math.max(sx(Math.max(lo, a)), pad - 6), R = Math.min(sx(Math.min(hi, b)), W - pad + 6)
        els.push(<DPath key={els.length} d={`M${L} ${yy}L${R} ${yy}`} stroke={c} width={5} delay={lane * 300} />)
        els.push(<path key={els.length} d={`M${L} ${yy}L${R} ${yy}L${R} ${y}L${L} ${y}Z`} fill={c} opacity={0.12} className="mn-fade-in" />)
        for (const [v, closed] of [[lo, m[1] === '['], [hi, m[4] === ']']] as [number, boolean][])
          if (v >= a && v <= b) els.push(<circle key={els.length} cx={sx(v)} cy={yy} r={5.5} fill={closed ? c : '#fff'} stroke={c} strokeWidth={2.2} className="mn-pop" style={{ animationDelay: `${700 + lane * 300}ms` }} />)
        if (o.label) els.push(<MathLabel key={els.length} text={o.label} x={(L + R) / 2} y={yy - 10} anchor="middle" fill={c} />)
        lane++
      } else if ((m = rest.match(/^(point|mark)\s+(\S+)(?:\s+(open|closed))?/))) {
        const v = num(m[2])
        const c = color(o.color || 'red')
        els.push(<circle key={els.length} cx={sx(v)} cy={y} r={m[1] === 'mark' ? 3.5 : 5.5} fill={m[3] === 'open' || o.open ? '#fff' : c} stroke={c} strokeWidth={2} className="mn-pop" style={{ animationDelay: '900ms' }} />)
        if (o.label) els.push(<MathLabel key={els.length} text={o.label} x={sx(v)} y={y + 34} anchor="middle" fill={c} />)
      } else if ((m = rest.match(/^ray\s+x\s*([<>]=?)\s*(\S+)/))) {
        const v = num(m[2]), c = color(o.color || 'green', lane)
        const yy = y - 10 - lane * 9
        const to = m[1].startsWith('>') ? W - pad + 10 : pad - 10
        els.push(<DPath key={els.length} d={`M${sx(v)} ${yy}L${to} ${yy}`} stroke={c} width={5} marker={arrowId(o.color || 'green')} />)
        els.push(<circle key={els.length} cx={sx(v)} cy={yy} r={5.5} fill={m[1].endsWith('=') ? c : '#fff'} stroke={c} strokeWidth={2.2} className="mn-pop" />)
        lane++
      } else throw new Error(`Cannot understand "${raw}"`)
    } catch (e: any) {
      errors.push(e.message)
    }
  }
  const ticks: number[] = []
  const step = Number(attrs.step) || Math.max(1, Math.round((b - a) / 12))
  for (let t = Math.ceil(a / step) * step; t <= b; t += step) ticks.push(t)
  return (
    <div className="mn-fig-box">
      <Frame v={{ W, H }}>
        <line x1={pad - 14} x2={W - pad + 14} y1={y} y2={y} stroke="#4F6272" strokeWidth={1.3} markerEnd="url(#mn-arrow-axis)" markerStart="url(#mn-arrow-axis)" />
        {ticks.map((t) => (
          <g key={t}>
            <line x1={sx(t)} x2={sx(t)} y1={y - 5} y2={y + 5} stroke="#4F6272" />
            <text x={sx(t)} y={y + 20} textAnchor="middle" fontSize="13" fill="#4F6272" fontFamily="var(--font-sheet)">{String(t).replace('-', '−')}</text>
          </g>
        ))}
        {els}
      </Frame>
      {errors.length > 0 && <FigError msg={errors.join('; ')} />}
    </div>
  )
}

/* ═════════════ vectors in the plane ═════════════ */
type V2 = [number, number]
const pt = (s: string): V2 | null => {
  const m = s.match(/\(\s*([^,]+)\s*,\s*([^)]+)\)/)
  return m ? [num(m[1]), num(m[2])] : null
}

export function Vectors({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const v = useMemo(() => makeView(attrs, [-1, 5], undefined, { equal: true, W: 460 }), [attrs])
  const vecs: Record<string, { from: V2; to: V2; c: string; cn?: string; label?: string; i: number }> = {}
  const extra: React.ReactNode[] = []
  const errors: string[] = []
  let i = 0
  for (const raw of lines(body)) {
    const { opts: o, rest } = parseOpts(raw)
    let m: RegExpMatchArray | null
    if ((m = rest.match(/^(\w+)\s*=\s*(\(.+\))$/))) {
      const to = pt(m[2])!
      const from = (o.from && pt(o.from)) || [0, 0]
      vecs[m[1]] = { from, to: [from[0] + to[0], from[1] + to[1]], c: color(o.color, i), cn: o.color, label: o.label || `$\\vec{${m[1]}}$`, i: i++ }
    } else if ((m = rest.match(/^sum\s+(\w+)\s+(\w+)(\s+parallelogram)?/))) {
      const A = vecs[m[1]], B = vecs[m[2]]
      if (!A || !B) { errors.push(`unknown vector in "${raw}"`); continue }
      const a: V2 = [A.to[0] - A.from[0], A.to[1] - A.from[1]], b: V2 = [B.to[0] - B.from[0], B.to[1] - B.from[1]]
      const s: V2 = [a[0] + b[0], a[1] + b[1]]
      if (m[3]) {
        extra.push(<path key={extra.length} d={`M${v.sx(0)} ${v.sy(0)}L${v.sx(a[0])} ${v.sy(a[1])}L${v.sx(s[0])} ${v.sy(s[1])}L${v.sx(b[0])} ${v.sy(b[1])}Z`} fill="#C9A227" opacity={0.1} className="mn-fade-in" style={{ animationDelay: '1s' }} />)
        extra.push(<DPath key={extra.length} d={`M${v.sx(a[0])} ${v.sy(a[1])}L${v.sx(s[0])} ${v.sy(s[1])}L${v.sx(b[0])} ${v.sy(b[1])}`} stroke="#8C99A3" width={1.4} dash />)
      }
      vecs[o.name || `${m[1]}+${m[2]}`] = { from: [0, 0], to: s, c: color(o.color || 'gold'), cn: o.color || 'gold', label: o.label || `$\\vec{${m[1]}}+\\vec{${m[2]}}$`, i: i++ }
    } else if ((m = rest.match(/^projection\s+(\w+)\s+on\s+(\w+)/))) {
      const A = vecs[m[1]], B = vecs[m[2]]
      if (!A || !B) { errors.push(`unknown vector in "${raw}"`); continue }
      const a = A.to, b = B.to
      const k = (a[0] * b[0] + a[1] * b[1]) / (b[0] * b[0] + b[1] * b[1])
      const p: V2 = [k * b[0], k * b[1]]
      extra.push(<DPath key={extra.length} d={`M${v.sx(a[0])} ${v.sy(a[1])}L${v.sx(p[0])} ${v.sy(p[1])}`} stroke="#8C99A3" width={1.3} dash />)
      vecs[`proj`] = { from: [0, 0], to: p, c: color(o.color || 'green'), cn: o.color || 'green', label: o.label || `$\\mathrm{proj}_{${m[2]}}${m[1]}$`, i: i++ }
    } else if (rest) errors.push(`Cannot understand "${raw}"`)
  }
  return (
    <div className="mn-fig-box">
      <Frame v={v}>
        <Axes v={v} grid={attrs.grid !== 'off'} />
        {extra}
        {Object.values(vecs).map((q) => (
          <g key={q.i}>
            <DPath d={`M${v.sx(q.from[0])} ${v.sy(q.from[1])}L${v.sx(q.to[0])} ${v.sy(q.to[1])}`} stroke={q.c} width={2.6} marker={arrowId(q.cn, q.i)} delay={q.i * 350} />
            {q.label && <MathLabel text={q.label} x={v.sx((q.from[0] + q.to[0]) / 2) + 8} y={v.sy((q.from[1] + q.to[1]) / 2) - 8} fill={q.c} size={15} />}
          </g>
        ))}
      </Frame>
      {errors.length > 0 && <FigError msg={errors.join('; ')} />}
    </div>
  )
}

/* ═════════════ plane geometry ═════════════ */
export function Geometry({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const v = useMemo(() => makeView(attrs, [-1, 6], undefined, { equal: true, W: 460 }), [attrs])
  const P: Record<string, V2> = {}
  const shapes: React.ReactNode[] = []
  const errors: string[] = []
  let d = 0
  const add = (n: React.ReactNode) => shapes.push(n)
  for (const raw0 of lines(body)) {
    for (const raw of raw0.split(';').map((s) => s.trim()).filter(Boolean)) {
      const { opts: o, rest } = parseOpts(raw)
      let m: RegExpMatchArray | null
      const c = color(o.color || 'navy')
      if ((m = rest.match(/^([A-Z]\w*)\s*=\s*(\(.+\))$/))) P[m[1]] = pt(m[2])!
      else if ((m = rest.match(/^polygon\s+(.+)$/))) {
        const ps = m[1].split(/\s+/).map((n) => P[n]).filter(Boolean)
        const path = ps.map((p, k) => `${k ? 'L' : 'M'}${v.sx(p[0])} ${v.sy(p[1])}`).join('') + 'Z'
        add(<path key={shapes.length} d={path} fill={color(o.fill || 'blue')} opacity={num(o.opacity, 0.1)} className="mn-fade-in" style={{ animationDelay: '1.2s' }} />)
        add(<DPath key={shapes.length} d={path} stroke={c} width={2} delay={d++ * 200} />)
      } else if ((m = rest.match(/^(segment|line)\s+(\w+)\s+(\w+)/))) {
        const A = P[m[2]], B = P[m[3]]
        if (!A || !B) { errors.push(raw); continue }
        let a = A, b = B
        if (m[1] === 'line') {
          const dx = B[0] - A[0], dy = B[1] - A[1], L = 100
          a = [A[0] - dx * L, A[1] - dy * L]; b = [A[0] + dx * L, A[1] + dy * L]
        }
        add(<DPath key={shapes.length} d={`M${v.sx(a[0])} ${v.sy(a[1])}L${v.sx(b[0])} ${v.sy(b[1])}`} stroke={c} width={1.8} dash={!!o.dash} delay={d++ * 200} />)
        if (o.label) add(<MathLabel key={shapes.length} text={o.label} x={v.sx((A[0] + B[0]) / 2) + 6} y={v.sy((A[1] + B[1]) / 2) + 16} fill={c} />)
      } else if ((m = rest.match(/^circle\s+center=(\w+)\s+radius=(\S+)/)) || (m = rest.match(/^circle\s+(\w+)\s+(\S+)$/))) {
        const C = P[m[1]], r = num(m[2])
        if (!C) { errors.push(raw); continue }
        const R = Math.abs(v.sx(r) - v.sx(0))
        add(<DPath key={shapes.length} d={`M${v.sx(C[0]) + R} ${v.sy(C[1])}a${R} ${R} 0 1 0 ${-2 * R} 0a${R} ${R} 0 1 0 ${2 * R} 0`} stroke={c} width={1.8} dash={!!o.dash} delay={d++ * 200} />)
      } else if ((m = rest.match(/^angle\s+(\w+)\s+(\w+)\s+(\w+)/))) {
        const A = P[m[1]], O = P[m[2]], B = P[m[3]]
        if (!A || !O || !B) { errors.push(raw); continue }
        const a1 = Math.atan2(A[1] - O[1], A[0] - O[0]), a2 = Math.atan2(B[1] - O[1], B[0] - O[0])
        let da = a2 - a1
        while (da <= -Math.PI) da += 2 * Math.PI
        while (da > Math.PI) da -= 2 * Math.PI
        const R = 26
        const p1 = [v.sx(O[0]) + R * Math.cos(a1), v.sy(O[1]) - R * Math.sin(a1)], p2 = [v.sx(O[0]) + R * Math.cos(a1 + da), v.sy(O[1]) - R * Math.sin(a1 + da)]
        add(<DPath key={shapes.length} d={`M${p1[0]} ${p1[1]}A${R} ${R} 0 0 ${da > 0 ? 0 : 1} ${p2[0]} ${p2[1]}`} stroke={color(o.color || 'red')} width={1.6} delay={900} />)
        if (o.label) add(<MathLabel key={shapes.length} text={o.label} x={v.sx(O[0]) + (R + 12) * Math.cos(a1 + da / 2)} y={v.sy(O[1]) - (R + 12) * Math.sin(a1 + da / 2) + 5} anchor="middle" fill={color(o.color || 'red')} />)
      } else if ((m = rest.match(/^midpoint\s+(\w+)\s+of\s+(\w+)\s+(\w+)/))) {
        const A = P[m[2]], B = P[m[3]]
        if (A && B) P[m[1]] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
      } else if ((m = rest.match(/^perpendicular\s+from\s+(\w+)\s+to\s+(\w)(\w)/))) {
        const C = P[m[1]], A = P[m[2]], B = P[m[3]]
        if (!C || !A || !B) { errors.push(raw); continue }
        const dx = B[0] - A[0], dy = B[1] - A[1]
        const t = ((C[0] - A[0]) * dx + (C[1] - A[1]) * dy) / (dx * dx + dy * dy)
        const F: V2 = [A[0] + t * dx, A[1] + t * dy]
        P[o.name || 'H'] = F
        add(<DPath key={shapes.length} d={`M${v.sx(C[0])} ${v.sy(C[1])}L${v.sx(F[0])} ${v.sy(F[1])}`} stroke={color(o.color || 'gray')} width={1.5} dash delay={700} />)
        const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy), s = 0.25 * (v.x1 - v.x0) / 14
        const q1: V2 = [F[0] + ux * s, F[1] + uy * s], q2: V2 = [q1[0] + (C[0] - F[0]) / Math.hypot(C[0] - F[0], C[1] - F[1]) * s, q1[1] + (C[1] - F[1]) / Math.hypot(C[0] - F[0], C[1] - F[1]) * s]
        const q3: V2 = [q2[0] - ux * s, q2[1] - uy * s]
        add(<path key={shapes.length} d={`M${v.sx(q1[0])} ${v.sy(q1[1])}L${v.sx(q2[0])} ${v.sy(q2[1])}L${v.sx(q3[0])} ${v.sy(q3[1])}`} fill="none" stroke="#8C99A3" className="mn-fade-in" />)
      } else if (rest) errors.push(`Cannot understand "${raw}"`)
    }
  }
  return (
    <div className="mn-fig-box">
      <Frame v={v}>
        {attrs.axes === 'on' && <Axes v={v} grid={attrs.grid === 'on'} />}
        {shapes}
        {Object.entries(P).map(([n, p], k) => (
          <g key={n} className="mn-pop" style={{ animationDelay: `${300 + k * 90}ms` }}>
            <circle cx={v.sx(p[0])} cy={v.sy(p[1])} r={3.6} fill="#12233C" />
            <MathLabel text={`$${n}$`} x={v.sx(p[0]) + 7} y={v.sy(p[1]) - 7} size={15} />
          </g>
        ))}
      </Frame>
      {errors.length > 0 && <FigError msg={errors.join('; ')} />}
    </div>
  )
}

/* ═════════════ complex plane ═════════════ */
function cplx(s: string): V2 | null {
  const t = s.replace(/\s+/g, '').replace(/−/g, '-')
  if (!t) return null
  let re = 0, im = 0
  for (const m of t.matchAll(/([+-]?)([^+-]*)/g)) {
    if (!m[0]) continue
    const sign = m[1] === '-' ? -1 : 1
    const body = m[2]
    if (body.endsWith('i')) im += sign * (body === 'i' ? 1 : num(body.slice(0, -1).replace(/\*$/, ''), 1))
    else if (body) re += sign * num(body)
  }
  return [re, im]
}

export function Complex({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const v = useMemo(() => makeView(attrs, [-3, 3], undefined, { equal: true }), [attrs])
  const Z: Record<string, V2> = {}
  const els: React.ReactNode[] = []
  const errors: string[] = []
  let k = 0
  const get = (n: string): V2 | null => {
    const cm = n.match(/^conj\((\w+)\)$/)
    if (cm && Z[cm[1]]) return [Z[cm[1]][0], -Z[cm[1]][1]]
    return Z[n] || cplx(n)
  }
  for (const raw0 of lines(body)) {
    for (const raw of raw0.split(';').map((s) => s.trim()).filter(Boolean)) {
      const { opts: o, rest } = parseOpts(raw)
      let m: RegExpMatchArray | null
      if ((m = rest.match(/^(\w+)\s*=\s*(.+)$/))) {
        const z = cplx(m[2])
        if (z) Z[m[1]] = z
      } else if ((m = rest.match(/^(point|vector)s?\s+(.+)$/))) {
        for (const n of m[2].split(/\s+/)) {
          const z = get(n)
          if (!z) continue
          const c = color(o.color, k)
          if (m[1] === 'vector') els.push(<DPath key={els.length} d={`M${v.sx(0)} ${v.sy(0)}L${v.sx(z[0])} ${v.sy(z[1])}`} stroke={c} width={2.2} marker={arrowId(undefined, k)} delay={k * 250} />)
          els.push(<circle key={els.length} cx={v.sx(z[0])} cy={v.sy(z[1])} r={4.5} fill={c} className="mn-pop" style={{ animationDelay: `${400 + k * 150}ms` }} />)
          els.push(<MathLabel key={els.length} text={n.replace(/conj\((\w+)\)/, (_, q) => q[0] + '\u0304' + q.slice(1))} x={v.sx(z[0]) + 8} y={v.sy(z[1]) - 8} fill={c} />)
          k++
        }
      } else if ((m = rest.match(/^circle\s+\|z(?:\s*-\s*\(?([^|)]+)\)?)?\|\s*=\s*(\S+)/))) {
        const ctr = m[1] ? cplx(m[1])! : [0, 0]
        const r = num(m[2]), R = Math.abs(v.sx(r) - v.sx(0))
        els.push(<DPath key={els.length} d={`M${v.sx(ctr[0]) + R} ${v.sy(ctr[1])}a${R} ${R} 0 1 0 ${-2 * R} 0a${R} ${R} 0 1 0 ${2 * R} 0`} stroke={color(o.color || 'gray')} width={1.6} dash={!!o.dash} />)
      } else if ((m = rest.match(/^polar(?:-form)?\s+(\w+)/))) {
        const z = get(m[1])
        if (!z) continue
        const r = Math.hypot(z[0], z[1]), th = Math.atan2(z[1], z[0])
        const c = color(o.color || 'red')
        els.push(<DPath key={els.length} d={`M${v.sx(0)} ${v.sy(0)}L${v.sx(z[0])} ${v.sy(z[1])}`} stroke={c} width={1.6} dash />)
        const R = 30
        els.push(<DPath key={els.length} d={`M${v.sx(0) + R} ${v.sy(0)}A${R} ${R} 0 ${Math.abs(th) > Math.PI ? 1 : 0} ${th > 0 ? 0 : 1} ${v.sx(0) + R * Math.cos(th)} ${v.sy(0) - R * Math.sin(th)}`} stroke={c} width={1.6} delay={600} />)
        els.push(<MathLabel key={els.length} text={`$\\theta ≈ ${th.toFixed(2)}$`} x={v.sx(0) + R + 8} y={v.sy(0) - 10} fill={c} size={13} />)
        els.push(<MathLabel key={els.length} text={`$r = ${+r.toFixed(3)}$`} x={v.sx(z[0] / 2) - 10} y={v.sy(z[1] / 2) - 8} fill={c} size={13} anchor="end" />)
      } else if (rest) errors.push(`Cannot understand "${raw}"`)
    }
  }
  return (
    <div className="mn-fig-box">
      <Frame v={v}>
        <Axes v={v} grid={attrs.grid !== 'off'} xLabel="Re" yLabel="Im" />
        {els}
      </Frame>
      {errors.length > 0 && <FigError msg={errors.join('; ')} />}
    </div>
  )
}
