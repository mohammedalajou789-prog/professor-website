'use client'

import { useEffect, useRef } from 'react'

type Variant = 'spiral' | 'saddle' | 'vortex' | 'waves'

/** Vector fields (x, y in roughly [-2, 2]) — each one is a real dynamical system. */
const FIELDS: Record<Variant, (x: number, y: number, t: number) => [number, number]> = {
  // stable spiral  X' = [[-0.2, -1],[1, -0.2]] X
  spiral: (x, y) => [-0.15 * x - y, x - 0.15 * y],
  // saddle  X' = [[1, 0.4],[0.4, -1]] X  (gives hyperbolic flow lines)
  saddle: (x, y) => [0.8 * x + 0.35 * y, 0.35 * x - 0.8 * y],
  // pair of vortices (point vortex flow)
  vortex: (x, y) => {
    const v = (cx: number, cy: number, s: number) => {
      const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy + 0.08
      return [(-s * dy) / r2, (s * dx) / r2]
    }
    const a = v(-0.9, 0, 1), b = v(0.9, 0, -1)
    return [a[0] + b[0] + 0.25, a[1] + b[1]]
  },
  // travelling waves — sin field drifting in time
  waves: (x, y, t) => [1, 0.9 * Math.sin(1.6 * x - t * 0.6) * Math.cos(0.8 * y)],
}

export default function MathField({
  variant = 'spiral',
  className = '',
  color = '201,162,39',
  density = 1,
  speed = 1,
}: {
  variant?: Variant
  className?: string
  color?: string
  density?: number
  speed?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const field = FIELDS[variant]
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0, h = 0, raf = 0, running = false, t = 0
    type P = { x: number; y: number; age: number; life: number }
    let ps: P[] = []

    const spawn = (): P => ({ x: (Math.random() * 2 - 1) * 2.2, y: (Math.random() * 2 - 1) * 2.2 * (h / Math.max(w, 1)), age: 0, life: 80 + Math.random() * 160 })

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = Math.max(1, r.width)
      h = Math.max(1, r.height)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const n = Math.round(Math.min(420, (w * h) / 2600) * density)
      ps = Array.from({ length: n }, spawn)
      ctx.clearRect(0, 0, w, h)
    }

    const scale = () => Math.max(w, h) / 4.4
    const toScreen = (x: number, y: number): [number, number] => [w / 2 + x * scale(), h / 2 - y * scale()]

    const step = () => {
      t += 0.016 * speed
      // fade previous frame → trails
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.06)'
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = 1.1
      for (const p of ps) {
        const [vx, vy] = field(p.x, p.y, t)
        const m = Math.hypot(vx, vy) || 1
        const k = (0.012 * speed) / Math.max(0.6, Math.min(m, 3)) * Math.min(m, 3)
        const nx = p.x + (vx / m) * k * 2.2
        const ny = p.y + (vy / m) * k * 2.2
        const [sx, sy] = toScreen(p.x, p.y)
        const [ex, ey] = toScreen(nx, ny)
        const life = p.age / p.life
        const alpha = Math.sin(Math.PI * Math.min(1, life)) * 0.55
        ctx.strokeStyle = `rgba(${color},${alpha.toFixed(3)})`
        ctx.beginPath()
        ctx.moveTo(sx, sy)
        ctx.lineTo(ex, ey)
        ctx.stroke()
        p.x = nx
        p.y = ny
        p.age++
        if (p.age > p.life || Math.abs(p.x) > 3 || Math.abs(p.y) > 3) Object.assign(p, spawn())
      }
    }

    const loop = () => {
      if (!running) return
      step()
      raf = requestAnimationFrame(loop)
    }

    resize()
    if (reduce) {
      for (let i = 0; i < 120; i++) step()
      return
    }
    let inView = false
    const sync = () => {
      const should = inView && !document.hidden
      if (should && !running) {
        running = true
        loop()
      } else if (!should && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    }
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting
      sync()
    })
    io.observe(canvas)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const vis = sync
    document.addEventListener('visibilitychange', vis)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', vis)
    }
  }, [variant, color, density, speed])

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />
}
