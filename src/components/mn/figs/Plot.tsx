'use client'

import { useId, useMemo, useState } from 'react'
import { compile, num, parseOpts, range, type Fn } from '@/lib/mn/expr'
import { Axes, DPath, FigError, Frame, MathLabel, color, lines, makeView, samplePath, arrowId, type View } from './core'

type Item =
  | { k: 'fn'; name: string; f: Fn; o: Record<string, string>; i: number }
  | { k: 'param'; fx: Fn; fy: Fn; t: [number, number]; o: Record<string, string>; i: number }
  | { k: 'polar'; r: Fn; th: [number, number]; o: Record<string, string>; i: number }
  | { k: 'implicit'; g: Fn; o: Record<string, string>; i: number }
  | { k: 'region'; g: Fn; o: Record<string, string>; i: number }
  | { k: 'point'; x: Fn; y: Fn; o: Record<string, string>; i: number }
  | { k: 'area'; f: string; g?: string; a: Fn; b: Fn; o: Record<string, string>; i: number }
  | { k: 'tangent'; f: string; a: Fn; o: Record<string, string>; i: number }
  | { k: 'asym'; axis: 'x' | 'y'; v: Fn; o: Record<string, string>; i: number }
  | { k: 'riemann'; f: string; a: Fn; b: Fn; n: number; rule: string; o: Record<string, string>; i: number }
  | { k: 'seg'; p: [Fn, Fn]; q: [Fn, Fn]; arrow: boolean; o: Record<string, string>; i: number }
  | { k: 'text'; x: Fn; y: Fn; label: string; o: Record<string, string>; i: number }

type Slider = { name: string; v: number; min: number; max: number; step: number }

const PT = /\(\s*([^,()]+(?:\([^()]*\))*[^,()]*)\s*,\s*([^()]+(?:\([^()]*\))*[^()]*)\s*\)/

export function parsePlot(body: string) {
  const sliders: Slider[] = []
  const items: Item[] = []
  const errors: string[] = []
  let ci = 0
  for (const raw of lines(body)) {
    try {
      const sm = raw.match(/^slider\s+(\w+)\s*=\s*(\S+)\s+in\s+\[([^\]]+)\](?:\s+step\s+(\S+))?/)
      if (sm) {
        const [lo, hi] = range(`[${sm[3]}]`, [0, 1])
        sliders.push({ name: sm[1], v: num(sm[2]), min: lo, max: hi, step: num(sm[4], (hi - lo) / 100) })
        continue
      }
      const vars = ['x', 'y', 't', 'theta', 'θ', 'r', ...sliders.map((s) => s.name)]
      const { opts: o, rest } = parseOpts(raw)
      let m: RegExpMatchArray | null
      if ((m = rest.match(/^param\s*\((.+)\)$/))) {
        const inner = m[1]
        // split at top-level comma
        let depth = 0, cut = -1
        for (let k = 0; k < inner.length; k++) {
          if (inner[k] === '(') depth++
          else if (inner[k] === ')') depth--
          else if (inner[k] === ',' && depth === 0) { cut = k; break }
        }
        items.push({ k: 'param', fx: compile(inner.slice(0, cut), vars), fy: compile(inner.slice(cut + 1), vars), t: range(o.t, [0, 2 * Math.PI]), o, i: ci++ })
      } else if ((m = rest.match(/^polar\s+r\s*=\s*(.+)$/))) {
        items.push({ k: 'polar', r: compile(m[1], vars), th: range(o.theta, [0, 2 * Math.PI]), o, i: ci++ })
      } else if ((m = rest.match(/^region\s+(.+)$/))) {
        const conds = m[1].split(/\s+and\s+|&&/).map((c) => compile(c.replace(/(^|[^<>=!])=([^=]|$)/g, '$1==$2'), vars))
        items.push({ k: 'region', g: (e) => +conds.every((c) => c(e)), o, i: ci++ })
      } else if ((m = rest.match(/^point\s*(.+)$/))) {
        const pm = m[1].match(PT)
        if (!pm) throw new Error('point needs (x, y)')
        items.push({ k: 'point', x: compile(pm[1], vars), y: compile(pm[2], vars), o, i: ci })
      } else if ((m = rest.match(/^(?:area|between)\s+(\w+)(?:\(x\))?(?:\s+(\w+)(?:\(x\))?)?\s+from\s+(\S+)\s+to\s+(\S+)$/))) {
        items.push({ k: 'area', f: m[1], g: m[2], a: compile(m[3], vars), b: compile(m[4], vars), o, i: ci })
      } else if ((m = rest.match(/^tangent\s+(\w+)\s+at\s+(\S+)$/))) {
        items.push({ k: 'tangent', f: m[1], a: compile(m[2], vars), o, i: ci++ })
      } else if ((m = rest.match(/^asymptote\s+([xy])\s*=\s*(.+)$/))) {
        items.push({ k: 'asym', axis: m[1] as 'x' | 'y', v: compile(m[2], vars), o, i: ci })
      } else if ((m = rest.match(/^riemann\s+(\w+)\s+from\s+(\S+)\s+to\s+(\S+)(?:\s+(left|right|mid))?/))) {
        items.push({ k: 'riemann', f: m[1], a: compile(m[2], vars), b: compile(m[3], vars), n: num(o.n, 8), rule: m[4] || o.rule || 'mid', o, i: ci })
      } else if ((m = rest.match(/^(segment|vector|arrow)\s+(.+)$/))) {
        const pts = [...m[2].matchAll(new RegExp(PT.source, 'g'))]
        if (pts.length < 2) throw new Error(`${m[1]} needs two points`)
        items.push({ k: 'seg', p: [compile(pts[0][1], vars), compile(pts[0][2], vars)], q: [compile(pts[1][1], vars), compile(pts[1][2], vars)], arrow: m[1] !== 'segment', o, i: ci++ })
      } else if ((m = rest.match(/^text\s*(\(.+?\))\s*(.*)$/))) {
        const pm = m[1].match(PT)!
        items.push({ k: 'text', x: compile(pm[1], vars), y: compile(pm[2], vars), label: o.label || m[2].replace(/^"|"$/g, ''), o, i: ci })
      } else if ((m = rest.match(/^(?:([A-Za-z]\w*)\s*\(\s*x\s*\)|y)\s*=\s*(.+)$/))) {
        items.push({ k: 'fn', name: m[1] || `y${ci}`, f: compile(m[2], vars), o, i: ci++ })
      } else if (rest.includes('=')) {
        const [l, r] = rest.split('=')
        const L = compile(l, vars), R = compile(r, vars)
        items.push({ k: 'implicit', g: (e) => L(e) - R(e), o, i: ci++ })
      } else throw new Error(`Cannot understand "${raw}"`)
    } catch (e: any) {
      errors.push(e.message)
    }
  }
  return { items, sliders, errors }
}

/** marching squares for g(x,y)=0 */
function contour(g: (x: number, y: number) => number, v: View, n = 120) {
  const nx = n, ny = Math.round((n * v.H) / v.W)
  const dx = (v.x1 - v.x0) / nx, dy = (v.y1 - v.y0) / ny
  const val: number[][] = []
  for (let j = 0; j <= ny; j++) {
    val[j] = []
    for (let i = 0; i <= nx; i++) val[j][i] = g(v.x0 + i * dx, v.y0 + j * dy)
  }
  let d = ''
  const lerp = (a: number, b: number) => (Math.abs(a - b) < 1e-12 ? 0.5 : a / (a - b))
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const nz = (q: number) => (q === 0 ? 1e-12 : q)
      const a = nz(val[j][i]), b = nz(val[j][i + 1]), c = nz(val[j + 1][i + 1]), e = nz(val[j + 1][i])
      if (![a, b, c, e].every(isFinite)) continue
      const pts: [number, number][] = []
      const X = (ii: number) => v.x0 + ii * dx, Y = (jj: number) => v.y0 + jj * dy
      if (a * b < 0) pts.push([X(i + lerp(a, b)), Y(j)])
      if (b * c < 0) pts.push([X(i + 1), Y(j + lerp(b, c))])
      if (c * e < 0) pts.push([X(i + 1 - lerp(c, e)), Y(j + 1)])
      if (e * a < 0) pts.push([X(i), Y(j + 1 - lerp(e, a))])
      if (pts.length >= 2) d += `M${v.sx(pts[0][0]).toFixed(1)} ${v.sy(pts[0][1]).toFixed(1)}L${v.sx(pts[1][0]).toFixed(1)} ${v.sy(pts[1][1]).toFixed(1)}`
      if (pts.length === 4) d += `M${v.sx(pts[2][0]).toFixed(1)} ${v.sy(pts[2][1]).toFixed(1)}L${v.sx(pts[3][0]).toFixed(1)} ${v.sy(pts[3][1]).toFixed(1)}`
    }
  return d
}

export default function Plot({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const parsed = useMemo(() => parsePlot(body), [body])
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(parsed.sliders.map((s) => [s.name, s.v])))
  const v = useMemo(() => makeView(attrs, [-5, 5]), [attrs])
  const cid = 'c' + useId().replace(/:/g, '')

  const drawn = useMemo(() => {
    const env = { ...vals }
    const fns: Record<string, (x: number) => number> = {}
    const els: React.ReactNode[] = []
    const fills: React.ReactNode[] = []
    const marks: React.ReactNode[] = []
    for (const it of parsed.items) {
      const c = color(it.o.color, it.i)
      const w = num(it.o.width, 2.2)
      const delay = it.i * 260
      switch (it.k) {
        case 'fn': {
          const f = (x: number) => it.f({ ...env, x })
          fns[it.name] = f
          els.push(<DPath key={els.length} d={samplePath(f, v)} stroke={c} width={w} dash={!!it.o.dash} delay={delay} />)
          if (it.o.label) {
            const lx = v.x0 + (v.x1 - v.x0) * num(it.o.at, 0.82)
            const ly = f(lx)
            if (isFinite(ly)) marks.push(<MathLabel key={'l' + marks.length} text={it.o.label} x={Math.min(v.sx(lx) + 6, v.W - v.pad - 30)} y={Math.max(v.pad + 12, Math.min(v.H - v.pad - 4, v.sy(ly) - 8))} fill={c} />)
          }
          break
        }
        case 'param': {
          let d = ''
          const N = 600
          for (let k = 0; k <= N; k++) {
            const t = it.t[0] + ((it.t[1] - it.t[0]) * k) / N
            const x = it.fx({ ...env, t }), y = it.fy({ ...env, t })
            if (isFinite(x) && isFinite(y)) d += `${d ? 'L' : 'M'}${v.sx(x).toFixed(2)} ${v.sy(y).toFixed(2)}`
          }
          els.push(<DPath key={els.length} d={d} stroke={c} width={w} dash={!!it.o.dash} delay={delay} />)
          break
        }
        case 'polar': {
          let d = ''
          const N = 900
          for (let k = 0; k <= N; k++) {
            const th = it.th[0] + ((it.th[1] - it.th[0]) * k) / N
            const r = it.r({ ...env, theta: th, θ: th, t: th })
            if (isFinite(r)) d += `${d ? 'L' : 'M'}${v.sx(r * Math.cos(th)).toFixed(2)} ${v.sy(r * Math.sin(th)).toFixed(2)}`
          }
          els.push(<DPath key={els.length} d={d} stroke={c} width={w} dash={!!it.o.dash} delay={delay} />)
          break
        }
        case 'implicit':
          els.push(<DPath key={els.length} d={contour((x, y) => it.g({ ...env, x, y }), v)} stroke={c} width={w} dash={!!it.o.dash} animate={false} delay={delay} />)
          break
        case 'region': {
          const n = 90, ny = Math.round((n * v.H) / v.W)
          const dx = (v.x1 - v.x0) / n, dy = (v.y1 - v.y0) / ny
          let d = ''
          for (let j = 0; j < ny; j++) {
            let run = -1
            for (let i = 0; i <= n; i++) {
              const inside = i < n && it.g({ ...env, x: v.x0 + (i + 0.5) * dx, y: v.y0 + (j + 0.5) * dy })
              if (inside && run < 0) run = i
              if (!inside && run >= 0) {
                d += `M${v.sx(v.x0 + run * dx)} ${v.sy(v.y0 + (j + 1) * dy)}H${v.sx(v.x0 + i * dx)}V${v.sy(v.y0 + j * dy)}H${v.sx(v.x0 + run * dx)}Z`
                run = -1
              }
            }
          }
          fills.push(<path key={fills.length} d={d} fill={c} opacity={num(it.o.opacity, 0.18)} className="mn-fade-in" shapeRendering="crispEdges" />)
          break
        }
        case 'area': {
          const f = fns[it.f], g = it.g ? fns[it.g] : () => 0
          if (!f) break
          const a = it.a(env), b = it.b(env)
          const N = 200
          let top = '', bot = ''
          for (let k = 0; k <= N; k++) {
            const x = a + ((b - a) * k) / N
            top += `${k ? 'L' : 'M'}${v.sx(x).toFixed(2)} ${v.sy(f(x)).toFixed(2)}`
          }
          for (let k = N; k >= 0; k--) {
            const x = a + ((b - a) * k) / N
            bot += `L${v.sx(x).toFixed(2)} ${v.sy(g!(x)).toFixed(2)}`
          }
          fills.push(<path key={fills.length} d={top + bot + 'Z'} fill={color(it.o.color || 'gold')} opacity={num(it.o.opacity, 0.3)} className="mn-fade-in" style={{ animationDelay: '900ms' }} />)
          break
        }
        case 'tangent': {
          const f = fns[it.f]
          if (!f) break
          const a = it.a(env), h = 1e-4
          const m = (f(a + h) - f(a - h)) / (2 * h)
          const L = (x: number) => f(a) + m * (x - a)
          els.push(<DPath key={els.length} d={samplePath(L, v, v.x0, v.x1, 2)} stroke={c} width={1.6} dash={it.o.dash !== 'false'} delay={delay} />)
          marks.push(<circle key={'tp' + marks.length} cx={v.sx(a)} cy={v.sy(f(a))} r={4.5} fill={c} className="mn-pop" />)
          break
        }
        case 'asym': {
          const val = it.v(env)
          const d = it.axis === 'x' ? `M${v.sx(val)} ${v.sy(v.y0)}V${v.sy(v.y1)}` : `M${v.sx(v.x0)} ${v.sy(val)}H${v.sx(v.x1)}`
          els.push(<path key={els.length} d={d} stroke={color(it.o.color || 'gray')} strokeWidth={1.3} strokeDasharray="7 6" className="mn-fade-in" />)
          break
        }
        case 'riemann': {
          const f = fns[it.f]
          if (!f) break
          const a = it.a(env), b = it.b(env), n = Math.max(1, Math.min(200, Math.round(it.n)))
          const h = (b - a) / n
          const rects: React.ReactNode[] = []
          let sum = 0
          for (let k = 0; k < n; k++) {
            const xs = it.rule === 'left' ? a + k * h : it.rule === 'right' ? a + (k + 1) * h : a + (k + 0.5) * h
            const y = f(xs)
            sum += y * h
            rects.push(<rect key={k} x={v.sx(a + k * h)} y={Math.min(v.sy(y), v.sy(0))} width={Math.abs(v.sx(a + h) - v.sx(a))} height={Math.abs(v.sy(y) - v.sy(0))} fill={color(it.o.color || 'sky')} fillOpacity={0.22} stroke={color(it.o.color || 'blue')} strokeWidth={1} className="mn-pop" style={{ animationDelay: `${k * 50}ms` }} />)
          }
          fills.push(<g key={fills.length}>{rects}</g>)
          marks.push(<MathLabel key={'rs' + marks.length} text={`Σ ≈ ${sum.toFixed(4)}`} x={v.W - v.pad} y={v.pad + 4} anchor="end" size={13} fill="#0B6FA4" />)
          break
        }
        case 'seg': {
          const x1 = it.p[0](env), y1 = it.p[1](env), x2 = it.q[0](env), y2 = it.q[1](env)
          els.push(<DPath key={els.length} d={`M${v.sx(x1)} ${v.sy(y1)}L${v.sx(x2)} ${v.sy(y2)}`} stroke={c} width={num(it.o.width, 2)} dash={!!it.o.dash} marker={it.arrow ? arrowId(it.o.color, it.i) : undefined} delay={delay} />)
          if (it.o.label) marks.push(<MathLabel key={'sl' + marks.length} text={it.o.label} x={v.sx((x1 + x2) / 2) + 6} y={v.sy((y1 + y2) / 2) - 6} fill={c} />)
          break
        }
        case 'point': {
          const x = it.x(env), y = it.y(env)
          const open = it.o.open !== undefined || it.o.style === 'open'
          marks.push(
            <g key={'p' + marks.length} className="mn-pop" style={{ animationDelay: `${600 + marks.length * 120}ms` }}>
              {it.o.guides !== undefined && <path d={`M${v.sx(x)} ${v.sy(0)}V${v.sy(y)}H${v.sx(0)}`} stroke="#8C99A3" strokeDasharray="3 4" fill="none" />}
              <circle cx={v.sx(x)} cy={v.sy(y)} r={5} fill={open ? '#fff' : color(it.o.color || 'navy')} stroke={color(it.o.color || 'navy')} strokeWidth={2} />
            </g>
          )
          if (it.o.label) marks.push(<MathLabel key={'pl' + marks.length} text={it.o.label} x={v.sx(x) + 8} y={v.sy(y) - 9} size={14} />)
          break
        }
        case 'text':
          marks.push(<MathLabel key={'t' + marks.length} text={it.label} x={v.sx(it.x(env))} y={v.sy(it.y(env))} anchor="middle" fill={color(it.o.color || 'navy')} />)
          break
      }
    }
    return { els, fills, marks }
  }, [parsed, vals, v])

  if (parsed.errors.length && !parsed.items.length) return <FigError msg={parsed.errors.join('; ')} />

  return (
    <div className="mn-fig-box">
      <Frame v={v}>
        <Axes v={v} grid={attrs.grid !== 'off'} axes={attrs.axes !== 'off'} labels={attrs.labels !== 'off'} piTicks={attrs.pi === 'on'} xLabel={attrs.xlabel || 'x'} yLabel={attrs.ylabel || 'y'} />
        <clipPath id={cid}>
          <rect x={v.pad} y={v.pad - 4} width={v.W - 2 * v.pad} height={v.H - 2 * v.pad + 8} />
        </clipPath>
        <g clipPath={`url(#${cid})`}>
          {drawn.fills}
          {drawn.els}
        </g>
        {drawn.marks}
      </Frame>
      {parsed.sliders.length > 0 && (
        <div className="mn-fig-ui">
          {parsed.sliders.map((s) => (
            <label key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <i style={{ fontFamily: 'var(--font-sheet)', fontSize: 16 }}>{s.name}</i>
              <input type="range" min={s.min} max={s.max} step={s.step} value={vals[s.name]} onChange={(e) => setVals({ ...vals, [s.name]: +e.target.value })} />
              <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 40 }}>{vals[s.name].toFixed(2)}</span>
            </label>
          ))}
        </div>
      )}
      {parsed.errors.length > 0 && <FigError msg={parsed.errors.join('; ')} />}
    </div>
  )
}
