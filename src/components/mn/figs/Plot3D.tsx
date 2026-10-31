'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { compile, num, parseOpts, range } from '@/lib/mn/expr'
import { FigError, lines } from './core'

type P3 = [number, number, number]
type Item =
  | { k: 'surface'; f: (x: number, y: number) => number; cmap: string }
  | { k: 'curve'; pts: P3[]; c: string }
  | { k: 'vector'; a: P3; b: P3; c: string }
  | { k: 'point'; p: P3; c: string }

const CM: Record<string, [number, number, number][]> = {
  viridis: [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]],
  ocean: [[11, 111, 164], [18, 164, 217], [201, 230, 245]],
  gold: [[18, 35, 60], [31, 95, 173], [201, 162, 39], [243, 220, 142]],
}
function cmap(name: string, t: number) {
  const s = CM[name] || CM.viridis
  const x = Math.max(0, Math.min(1, t)) * (s.length - 1)
  const i = Math.min(s.length - 2, Math.floor(x)), f = x - i
  return s[i].map((c, k) => Math.round(c + (s[i + 1][k] - c) * f)) as [number, number, number]
}
const p3 = (s: string): P3 => {
  const m = s.replace(/[()]/g, '').split(',').map((x) => num(x))
  return [m[0] || 0, m[1] || 0, m[2] || 0]
}
const COL: Record<string, string> = { red: '#C0392B', blue: '#1F5FAD', green: '#0E7C6B', gold: '#C9A227', navy: '#12233C', purple: '#7D3C98' }

export default function Plot3D({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [xr, yr] = [range(attrs.x, [-2, 2]), range(attrs.y, [-2, 2])]
  const { items, errors, zr } = useMemo(() => {
    const items: Item[] = []
    const errors: string[] = []
    let zmin = Infinity, zmax = -Infinity
    for (const l of lines(body)) {
      try {
        const { opts: o, rest } = parseOpts(l)
        let m: RegExpMatchArray | null
        if ((m = rest.match(/^surface\s+z\s*=\s*(.+)$/))) {
          const g = compile(m[1], ['x', 'y'])
          items.push({ k: 'surface', f: (x, y) => g({ x, y }), cmap: o.color || 'viridis' })
        } else if ((m = rest.match(/^plane\s+(.+)=(.+)$/))) {
          // a x + b y + c z = d
          const lhs = m[1], d = num(m[2])
          const coef = (v: string) => {
            const mm = lhs.replace(/\s/g, '').match(new RegExp(`([+-]?[\\d.]*)\\*?${v}`))
            return mm ? (mm[1] === '' || mm[1] === '+' ? 1 : mm[1] === '-' ? -1 : num(mm[1])) : 0
          }
          const a = coef('x'), b = coef('y'), c = coef('z') || 1
          items.push({ k: 'surface', f: (x, y) => (d - a * x - b * y) / c, cmap: o.color || 'ocean' })
        } else if ((m = rest.match(/^curve\s*\((.+)\)$/))) {
          const parts = m[1].split(',')
          const [fx, fy, fz] = parts.map((p) => compile(p, ['t']))
          const [t0, t1] = range(o.t, [0, 2 * Math.PI])
          const pts: P3[] = []
          for (let k = 0; k <= 400; k++) {
            const t = t0 + ((t1 - t0) * k) / 400
            pts.push([fx({ t }), fy({ t }), fz({ t })])
          }
          items.push({ k: 'curve', pts, c: COL[o.color] || '#C0392B' })
        } else if ((m = rest.match(/^vector\s*(\([^)]*\))\s*->\s*(\([^)]*\))/))) {
          items.push({ k: 'vector', a: p3(m[1]), b: p3(m[2]), c: COL[o.color] || '#C0392B' })
        } else if ((m = rest.match(/^point\s*(\([^)]*\))/))) {
          items.push({ k: 'point', p: p3(m[1]), c: COL[o.color] || '#12233C' })
        } else throw new Error(`Cannot understand "${l}"`)
      } catch (e: any) {
        errors.push(e.message)
      }
    }
    for (const it of items) {
      if (it.k === 'surface')
        for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) {
          const z = it.f(xr[0] + ((xr[1] - xr[0]) * i) / 20, yr[0] + ((yr[1] - yr[0]) * j) / 20)
          if (isFinite(z)) { zmin = Math.min(zmin, z); zmax = Math.max(zmax, z) }
        }
      if (it.k === 'curve') it.pts.forEach((p) => { zmin = Math.min(zmin, p[2]); zmax = Math.max(zmax, p[2]) })
    }
    if (!isFinite(zmin)) { zmin = -1; zmax = 1 }
    if (zmax - zmin < 1e-6) { zmin -= 1; zmax += 1 }
    return { items, errors, zr: range(attrs.z, [zmin, zmax]) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body])
  const [auto, setAuto] = useState(attrs.rotate !== 'off')

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const W = 640, H = 460
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = W * dpr; c.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    let phi = 0.8, theta = 1.05, raf = 0, drag: null | [number, number] = null, running = false
    const N = 34
    const norm = (x: number, y: number, z: number): P3 => [((x - xr[0]) / (xr[1] - xr[0])) * 2 - 1, ((y - yr[0]) / (yr[1] - yr[0])) * 2 - 1, (((z - zr[0]) / (zr[1] - zr[0])) * 2 - 1) * 0.8]
    const proj = ([x, y, z]: P3) => {
      const cx = x * Math.cos(phi) - y * Math.sin(phi), cy = x * Math.sin(phi) + y * Math.cos(phi)
      const py = cy * Math.cos(theta) - z * Math.sin(theta), depth = cy * Math.sin(theta) + z * Math.cos(theta)
      const s = 128 / (1 + 0.16 * py)
      return [W / 2 + cx * s, H / 2 + depth * -s * 0.95 * -1 * -1, py] as [number, number, number]
    }
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      // box
      ctx.strokeStyle = '#D5DEE8'; ctx.lineWidth = 1
      const corners: P3[] = [[-1, -1, -0.8], [1, -1, -0.8], [1, 1, -0.8], [-1, 1, -0.8]]
      ctx.beginPath()
      corners.forEach((p, k) => { const q = proj(p); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]) })
      ctx.closePath(); ctx.stroke()
      // axes
      const axes: [P3, P3, string][] = [[[-1, 0, 0], [1.25, 0, 0], 'x'], [[0, -1, 0], [0, 1.25, 0], 'y'], [[0, 0, -0.8], [0, 0, 1.05], 'z']]
      ctx.font = 'italic 15px "Times New Roman", serif'; ctx.fillStyle = '#12233C'; ctx.strokeStyle = '#4F6272'
      for (const [a, b, lab] of axes) {
        const p = proj(a), q = proj(b)
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke()
        ctx.fillText(lab, q[0] + 4, q[1])
      }
      const polys: { pts: [number, number][]; d: number; fill: string }[] = []
      for (const it of items) {
        if (it.k !== 'surface') continue
        const grid: (P3 | null)[][] = []
        for (let i = 0; i <= N; i++) {
          grid[i] = []
          for (let j = 0; j <= N; j++) {
            const x = xr[0] + ((xr[1] - xr[0]) * i) / N, y = yr[0] + ((yr[1] - yr[0]) * j) / N, z = it.f(x, y)
            grid[i][j] = isFinite(z) && z >= zr[0] - 1e-9 && z <= zr[1] + 1e-9 ? norm(x, y, z) : null
          }
        }
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const q = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]
          if (q.some((p) => !p)) continue
          const pr = q.map((p) => proj(p!))
          const zAvg = q.reduce((s, p) => s + p![2], 0) / 4
          const [r, g, b] = cmap(it.cmap, (zAvg / 0.8 + 1) / 2)
          polys.push({ pts: pr.map((p) => [p[0], p[1]]), d: pr.reduce((s, p) => s + p[2], 0) / 4, fill: `rgb(${r},${g},${b})` })
        }
      }
      polys.sort((a, b) => b.d - a.d)
      for (const p of polys) {
        ctx.beginPath()
        p.pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
        ctx.closePath()
        ctx.fillStyle = p.fill; ctx.globalAlpha = 0.92; ctx.fill()
        ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.6; ctx.stroke()
      }
      for (const it of items) {
        if (it.k === 'curve') {
          ctx.strokeStyle = it.c; ctx.lineWidth = 2.4; ctx.beginPath()
          it.pts.forEach((p, k) => { const q = proj(norm(...p)); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]) })
          ctx.stroke()
        } else if (it.k === 'vector') {
          const a = proj(norm(...it.a)), b = proj(norm(...it.b))
          ctx.strokeStyle = it.c; ctx.fillStyle = it.c; ctx.lineWidth = 2.6
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
          const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
          ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - 11 * Math.cos(ang - 0.4), b[1] - 11 * Math.sin(ang - 0.4)); ctx.lineTo(b[0] - 11 * Math.cos(ang + 0.4), b[1] - 11 * Math.sin(ang + 0.4)); ctx.fill()
        } else if (it.k === 'point') {
          const q = proj(norm(...it.p))
          ctx.fillStyle = it.c; ctx.beginPath(); ctx.arc(q[0], q[1], 5, 0, Math.PI * 2); ctx.fill()
        }
      }
    }
    const loop = () => {
      if (!running) return
      if (auto && !drag) phi += 0.004
      draw()
      raf = requestAnimationFrame(loop)
    }
    const down = (e: PointerEvent) => { drag = [e.clientX, e.clientY]; c.setPointerCapture(e.pointerId) }
    const move = (e: PointerEvent) => {
      if (!drag) return
      phi += (e.clientX - drag[0]) * 0.01
      theta = Math.max(0.2, Math.min(1.5, theta + (e.clientY - drag[1]) * 0.01))
      drag = [e.clientX, e.clientY]
      if (!running) draw()
    }
    const up = () => { drag = null }
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move); c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up)
    const io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting
      cancelAnimationFrame(raf)
      if (running) loop()
    })
    io.observe(c)
    draw()
    return () => {
      running = false
      cancelAnimationFrame(raf)
      io.disconnect()
      c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); c.removeEventListener('pointercancel', up)
    }
  }, [items, xr, yr, zr, auto])

  if (!items.length) return <FigError msg={errors.join('; ') || 'plot3d needs surface/curve/vector'} />
  return (
    <div className="mn-fig-box">
      <canvas ref={ref} style={{ width: '100%', maxWidth: 640, aspectRatio: '640/460', touchAction: 'pan-y', cursor: 'grab', display: 'block', margin: '0 auto' }} />
      <div className="mn-fig-ui">
        <span>Drag to rotate</span>
        <button type="button" onClick={() => setAuto(!auto)}>{auto ? '❚❚ Stop spin' : '⟳ Auto-spin'}</button>
      </div>
      {errors.length > 0 && <FigError msg={errors.join('; ')} />}
    </div>
  )
}
