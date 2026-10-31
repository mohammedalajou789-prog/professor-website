'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { compile, num, parseOpts } from '@/lib/mn/expr'
import { Axes, DPath, FigError, Frame, MathLabel, color, lines, makeView, type View } from './core'

type F2 = (x: number, y: number, t: number) => [number, number]

function parseField(body: string) {
  let field: F2 | null = null
  let linear: number[] | null = null
  let slope = false
  const starts: [number, number][] = []
  const flags: Record<string, string> = {}
  const errors: string[] = []
  let trajOpts: Record<string, string> = {}
  for (const raw of lines(body)) {
    try {
      const { opts, rest } = parseOpts(raw)
      let m: RegExpMatchArray | null
      if ((m = rest.match(/^matrix\s*\[(.+)\]$/))) {
        const a = m[1].split(/[;,\s]+/).filter(Boolean).map((s) => num(s))
        if (a.length !== 4) throw new Error('matrix needs 4 entries: [a b; c d]')
        linear = a
        field = (x, y) => [a[0] * x + a[1] * y, a[2] * x + a[3] * y]
      } else if ((m = rest.match(/^system\s+(.+)$/))) {
        const [l1, l2] = m[1].split(';')
        const ex = (s: string) => s.replace(/^\s*[\w]+'\s*=|^\s*d\w+\/dt\s*=/, '').trim()
        const fx = compile(ex(l1), ['x', 'y', 't']), fy = compile(ex(l2), ['x', 'y', 't'])
        field = (x, y, t) => [fx({ x, y, t }), fy({ x, y, t })]
      } else if ((m = rest.match(/^slope\s+(?:dy\/dx|y')\s*=\s*(.+)$/))) {
        const g = compile(m[1], ['x', 'y', 't'])
        slope = true
        field = (x, y) => [1, g({ x, y, t: x })]
      } else if ((m = rest.match(/^trajector(?:y|ies)\s+(?:from\s+)?(.+)$/))) {
        trajOpts = opts
        if (m[1].trim() === 'auto') flags.auto = 'on'
        for (const p of m[1].matchAll(/\(\s*([^,]+)\s*,\s*([^)]+)\)/g)) starts.push([num(p[1]), num(p[2])])
      } else if ((m = rest.match(/^(eigenlines|flow|classify|nullclines|arrows|equilibrium)\s+(on|off)$/))) {
        flags[m[1]] = m[2]
      } else throw new Error(`Cannot understand "${raw}"`)
    } catch (e: any) {
      errors.push(e.message)
    }
  }
  return { field, linear, slope, starts, flags, errors, trajOpts }
}

function rk4(f: F2, x: number, y: number, h: number, t = 0): [number, number] {
  const [a1, b1] = f(x, y, t)
  const [a2, b2] = f(x + (h / 2) * a1, y + (h / 2) * b1, t + h / 2)
  const [a3, b3] = f(x + (h / 2) * a2, y + (h / 2) * b2, t + h / 2)
  const [a4, b4] = f(x + h * a3, y + h * b3, t + h)
  return [x + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4), y + (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4)]
}

function trajectory(f: F2, v: View, x0: number, y0: number, dir: 1 | -1) {
  const span = Math.max(v.x1 - v.x0, v.y1 - v.y0)
  const pts: [number, number][] = [[x0, y0]]
  let x = x0, y = y0, t = 0
  for (let k = 0; k < 3000; k++) {
    const [vx, vy] = f(x, y, t)
    const sp = Math.hypot(vx, vy)
    if (!isFinite(sp) || sp < 1e-6) break
    const h = (dir * span * 0.004) / Math.max(sp, 0.05) // arc-length-ish stepping
    ;[x, y] = rk4(f, x, y, Math.max(-0.2, Math.min(0.2, h)), t)
    t += h
    pts.push([x, y])
    if (x < v.x0 - span || x > v.x1 + span || y < v.y0 - span || y > v.y1 + span) break
  }
  return pts
}

function eig2(a: number[]) {
  const [p, q, r, s] = a
  const tr = p + s, det = p * s - q * r, disc = tr * tr - 4 * det
  let type = ''
  if (Math.abs(det) < 1e-12) type = 'degenerate'
  else if (det < 0) type = 'saddle point (unstable)'
  else if (disc < -1e-12) type = Math.abs(tr) < 1e-9 ? 'center (stable)' : tr < 0 ? 'spiral point — asymptotically stable' : 'spiral point — unstable'
  else if (Math.abs(disc) < 1e-12) type = tr < 0 ? 'degenerate node — stable' : 'degenerate node — unstable'
  else type = tr < 0 ? 'node — asymptotically stable' : 'node — unstable'
  const vecs: { l: number; v: [number, number] }[] = []
  if (disc >= -1e-12) {
    for (const l of [(tr + Math.sqrt(Math.max(0, disc))) / 2, (tr - Math.sqrt(Math.max(0, disc))) / 2]) {
      let vx = q, vy = l - p
      if (Math.abs(vx) < 1e-12 && Math.abs(vy) < 1e-12) { vx = l - s; vy = r }
      if (Math.abs(vx) < 1e-12 && Math.abs(vy) < 1e-12) { vx = 1; vy = 0 }
      const n = Math.hypot(vx, vy)
      if (!vecs.some((w) => Math.abs(w.l - l) < 1e-9)) vecs.push({ l, v: [vx / n, vy / n] })
    }
  }
  return { tr, det, type, vecs }
}

const pathOf = (pts: [number, number][], v: View) => pts.map(([x, y], k) => `${k ? 'L' : 'M'}${v.sx(x).toFixed(1)} ${v.sy(y).toFixed(1)}`).join('')

export default function Field({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const P = useMemo(() => parseField(body), [body])
  const v = useMemo(() => makeView(attrs, [-4, 4], undefined, { equal: true }), [attrs])
  const cid = 'f' + useId().replace(/:/g, '')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [flowOn, setFlowOn] = useState(P.flags.flow === 'on')

  const content = useMemo(() => {
    const f = P.field
    if (!f) return null
    const out: React.ReactNode[] = []
    // direction field
    if (P.flags.arrows !== 'off') {
      const n = 19
      const cell = (v.W - 2 * v.pad) / n
      const segs: string[] = []
      for (let i = 0; i <= n; i++)
        for (let j = 0; j <= Math.round(((v.H - 2 * v.pad) / (v.W - 2 * v.pad)) * n); j++) {
          const px = v.pad + i * cell, py = v.H - v.pad - j * cell
          const x = v.ix(px), y = v.iy(py)
          const [a, b] = f(x, y, x)
          const sa = v.sx(x + a) - px, sb = v.sy(y + b) - py
          const L = Math.hypot(sa, sb)
          if (!L || !isFinite(L)) continue
          const ux = (sa / L) * cell * 0.36, uy = (sb / L) * cell * 0.36
          segs.push(`M${(px - ux).toFixed(1)} ${(py - uy).toFixed(1)}L${(px + ux).toFixed(1)} ${(py + uy).toFixed(1)}`)
          if (!P.slope) {
            const hx = px + ux, hy = py + uy, ang = Math.atan2(uy, ux)
            segs.push(`M${hx.toFixed(1)} ${hy.toFixed(1)}l${(-4 * Math.cos(ang - 0.45)).toFixed(1)} ${(-4 * Math.sin(ang - 0.45)).toFixed(1)}M${hx.toFixed(1)} ${hy.toFixed(1)}l${(-4 * Math.cos(ang + 0.45)).toFixed(1)} ${(-4 * Math.sin(ang + 0.45)).toFixed(1)}`)
          }
        }
      out.push(<path key="df" d={segs.join('')} stroke="#9BB3C9" strokeWidth={1.1} fill="none" className="mn-fade-in" />)
    }
    // linearisation
    let lin = P.linear
    if (!lin && !P.slope && (P.flags.eigenlines === 'on' || P.flags.classify === 'on')) {
      const h = 1e-5
      const [a0, b0] = f(0, 0, 0)
      if (Math.hypot(a0, b0) < 1e-6) {
        const [ax, bx] = f(h, 0, 0), [ay, by] = f(0, h, 0)
        lin = [(ax - a0) / h, (ay - a0) / h, (bx - b0) / h, (by - b0) / h]
      }
    }
    const E = lin ? eig2(lin) : null
    if (E && P.flags.eigenlines === 'on') {
      E.vecs.forEach((e, k) => {
        const R = Math.max(v.x1 - v.x0, v.y1 - v.y0) * 2
        out.push(<DPath key={'eg' + k} d={`M${v.sx(-e.v[0] * R)} ${v.sy(-e.v[1] * R)}L${v.sx(e.v[0] * R)} ${v.sy(e.v[1] * R)}`} stroke={color(k ? 'purple' : 'red')} width={1.8} dash delay={300} />)
      })
    }
    // trajectories
    let starts = P.starts
    if (P.flags.auto === 'on' || (!starts.length && !P.slope)) {
      starts = []
      const r = Math.min(v.x1 - v.x0, v.y1 - v.y0) * 0.42
      for (let k = 0; k < 12; k++) starts.push([r * Math.cos((k * Math.PI) / 6 + 0.2), r * Math.sin((k * Math.PI) / 6 + 0.2)])
    }
    starts.forEach(([x0, y0], k) => {
      const fwd = trajectory(f, v, x0, y0, 1)
      const back = trajectory(f, v, x0, y0, -1).reverse()
      const pts = [...back, ...fwd.slice(1)]
      const c = color(P.trajOpts.color || (P.starts.length ? undefined : 'blue'), k)
      out.push(<DPath key={'tr' + k} d={pathOf(pts, v)} stroke={c} width={num(P.trajOpts.width, 2)} delay={400 + k * 140} />)
      // direction arrow in the middle of the forward part
      const mid = fwd[Math.min(fwd.length - 2, Math.max(1, Math.floor(fwd.length * 0.18)))]
      const nxt = fwd[Math.min(fwd.length - 1, fwd.indexOf(mid) + 1)]
      if (mid && nxt) {
        const ang = Math.atan2(v.sy(nxt[1]) - v.sy(mid[1]), v.sx(nxt[0]) - v.sx(mid[0]))
        const cx = v.sx(mid[0]), cy = v.sy(mid[1])
        out.push(<path key={'ta' + k} d={`M${cx + 7 * Math.cos(ang)} ${cy + 7 * Math.sin(ang)}L${cx + 7 * Math.cos(ang + 2.5)} ${cy + 7 * Math.sin(ang + 2.5)}L${cx + 7 * Math.cos(ang - 2.5)} ${cy + 7 * Math.sin(ang - 2.5)}Z`} fill={c} className="mn-pop" style={{ animationDelay: `${1400 + k * 140}ms` }} />)
      }
      if (P.starts.length) out.push(<circle key={'ts' + k} cx={v.sx(x0)} cy={v.sy(y0)} r={3.2} fill={c} className="mn-pop" />)
    })
    if (P.flags.nullclines === 'on' && !P.slope) {
      // sample sign changes on a grid for x' = 0 and y' = 0
      for (const comp of [0, 1]) {
        const n = 100, ny = Math.round((n * v.H) / v.W)
        let d = ''
        const dx = (v.x1 - v.x0) / n, dy = (v.y1 - v.y0) / ny
        for (let j = 0; j < ny; j++)
          for (let i = 0; i < n; i++) {
            const x = v.x0 + i * dx, y = v.y0 + j * dy
            const a = f(x, y, 0)[comp], b = f(x + dx, y, 0)[comp], c = f(x, y + dy, 0)[comp]
            if (a * b < 0 || a * c < 0) d += `M${v.sx(x + dx / 2).toFixed(1)} ${v.sy(y + dy / 2).toFixed(1)}h0.1`
          }
        out.push(<path key={'nc' + comp} d={d} stroke={comp ? '#C9A227' : '#0E7C6B'} strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.75} className="mn-fade-in" />)
      }
    }
    if (E && (P.flags.equilibrium !== 'off')) out.push(<circle key="eq" cx={v.sx(0)} cy={v.sy(0)} r={4} fill="#12233C" className="mn-pop" />)
    return { out, E }
  }, [P, v])

  // animated particles following the flow
  useEffect(() => {
    const c = canvasRef.current
    const f = P.field
    if (!c || !f || !flowOn) return
    const ctx = c.getContext('2d')!
    let raf = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = v.W * dpr
    c.height = v.H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const rnd = () => [v.x0 + Math.random() * (v.x1 - v.x0), v.y0 + Math.random() * (v.y1 - v.y0), Math.random() * 120] as [number, number, number]
    const ps = Array.from({ length: 260 }, rnd)
    const span = Math.max(v.x1 - v.x0, v.y1 - v.y0)
    const tick = () => {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(0, 0, v.W, v.H)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgba(11,111,164,0.85)'
      for (const p of ps) {
        const [a, b] = f(p[0], p[1], 0)
        const sp = Math.hypot(a, b) || 1
        const h = (span * 0.0035) / Math.max(0.25, Math.min(sp, 4)) * Math.min(sp, 4)
        p[0] += (a / sp) * h
        p[1] += (b / sp) * h
        p[2]++
        if (p[2] > 160 || p[0] < v.x0 || p[0] > v.x1 || p[1] < v.y0 || p[1] > v.y1) Object.assign(p, rnd(), { 2: 0 })
        ctx.beginPath()
        ctx.arc(v.sx(p[0]), v.sy(p[1]), 1.6, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting) raf = requestAnimationFrame(tick)
    })
    io.observe(c)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      ctx.clearRect(0, 0, v.W, v.H)
    }
  }, [P, v, flowOn])

  if (!P.field) return <FigError msg={P.errors.join('; ') || 'field needs "system", "matrix" or "slope"'} />

  return (
    <div className="mn-fig-box">
      {content?.E && P.flags.classify === 'on' && <span className="mn-fig-tag">{content.E.type}</span>}
      <div style={{ position: 'relative', maxWidth: v.W, margin: '0 auto' }}>
        <Frame v={v}>
          <Axes v={v} grid={attrs.grid === 'on'} labels={attrs.labels !== 'off'} xLabel={attrs.xlabel || (P.slope ? 'x' : 'x')} yLabel={attrs.ylabel || 'y'} />
          <clipPath id={cid}>
            <rect x={v.pad} y={v.pad} width={v.W - 2 * v.pad} height={v.H - 2 * v.pad} />
          </clipPath>
          <g clipPath={`url(#${cid})`}>{content?.out}</g>
          {content?.E && P.flags.eigenlines === 'on' &&
            content.E.vecs.map((e, k) => (
              <MathLabel key={k} text={`$\\lambda_${k + 1} = ${+e.l.toFixed(3)}$`} x={v.W - v.pad - 4} y={v.pad + 16 + k * 18} anchor="end" size={13} fill={color(k ? 'purple' : 'red')} />
            ))}
        </Frame>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      </div>
      <div className="mn-fig-ui">
        <button type="button" onClick={() => setFlowOn(!flowOn)}>{flowOn ? '❚❚ Pause flow' : '▶ Animate flow'}</button>
      </div>
      {P.errors.length > 0 && <FigError msg={P.errors.join('; ')} />}
    </div>
  )
}
