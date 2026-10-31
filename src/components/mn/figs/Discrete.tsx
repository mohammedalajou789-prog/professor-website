'use client'

import { useEffect, useMemo, useRef } from 'react'
import { DPath, FigError, Frame, MathLabel, PALETTE, lines } from './core'


/* ═════════════ probability / decision tree ═════════════ */
type TNode = { label: string; edge?: string; children: TNode[]; depth: number; x?: number; y?: number }

export function Tree({ body }: { attrs: Record<string, string>; body: string }) {
  const rows = body.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'))
  const root: TNode = { label: '', children: [], depth: -1 }
  const stack: { ind: number; node: TNode }[] = [{ ind: -1, node: root }]
  for (const r of rows) {
    const ind = r.match(/^\s*/)![0].length
    const [label, edge] = r.trim().split(/\s*:\s*/)
    while (stack.length > 1 && stack[stack.length - 1].ind >= ind) stack.pop()
    const parent = stack[stack.length - 1].node
    const node: TNode = { label, edge, children: [], depth: parent.depth + 1 }
    parent.children.push(node)
    stack.push({ ind, node })
  }
  const top = root.children.length === 1 ? root.children[0] : root
  let leaf = 0
  let maxDepth = 0
  const place = (n: TNode) => {
    maxDepth = Math.max(maxDepth, n.depth)
    if (!n.children.length) n.y = leaf++
    else {
      n.children.forEach(place)
      n.y = (n.children[0].y! + n.children[n.children.length - 1].y!) / 2
    }
  }
  place(top)
  const levels = Math.max(1, maxDepth - top.depth)
  const colW = 150, rowH = 50, W = 110 + levels * colW
  const H = Math.max(120, leaf * rowH + 20)
  const X = (n: TNode) => 50 + (n.depth - top.depth) * colW
  const Y = (n: TNode) => 26 + n.y! * rowH
  const els: React.ReactNode[] = []
  let k = 0
  const walk = (n: TNode) => {
    for (const c of n.children) {
      const d = k++
      els.push(<DPath key={'e' + d} d={`M${X(n) + 14} ${Y(n)}L${X(c) - 16} ${Y(c)}`} stroke="#4F6272" width={1.5} delay={c.depth * 350} />)
      if (c.edge) els.push(<MathLabel key={'w' + d} text={`$${c.edge}$`} x={(X(n) + X(c)) / 2} y={(Y(n) + Y(c)) / 2 - 6} anchor="middle" size={13} fill="#C0392B" />)
      walk(c)
    }
    els.push(
      <g key={'n' + k++} className="mn-pop" style={{ animationDelay: `${n.depth * 350 + 200}ms` }}>
        {n.label && <circle cx={X(n)} cy={Y(n)} r={13} fill="#fff" stroke="#1F5FAD" strokeWidth={1.6} />}
        {n.label && <MathLabel text={n.label} x={X(n)} y={Y(n) + 5} anchor="middle" size={13} />}
      </g>
    )
  }
  walk(top)
  return (
    <div className="mn-fig-box">
      <Frame v={{ W, H }}>{els}</Frame>
    </div>
  )
}

/* ═════════════ Venn diagram (2 or 3 sets) with region shading ═════════════ */
export function Venn({ body }: { attrs: Record<string, string>; body: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sets: { name: string; els: string[] }[] = []
  let shade = ''
  let universe = 'U'
  for (const l0 of lines(body)) {
    for (const l of l0.split(';').map((s) => s.trim()).filter(Boolean)) {
      const m = l.match(/^(\w+)\s*=\s*\{(.*)\}$/)
      if (m) {
        if (m[1] === 'U') universe = 'U'
        else sets.push({ name: m[1], els: m[2].split(',').map((s) => s.trim()).filter(Boolean) })
      } else if (l.startsWith('shade')) shade = l.slice(5).trim()
    }
  }
  const n = Math.min(3, Math.max(2, sets.length))
  const W = 520, H = n === 3 ? 400 : 300
  const R = n === 3 ? 105 : 110
  const centers: [number, number][] = n === 3 ? [[W / 2 - 62, 160], [W / 2 + 62, 160], [W / 2, 262]] : [[W / 2 - 68, H / 2], [W / 2 + 68, H / 2]]
  const inside = (k: number, x: number, y: number) => Math.hypot(x - centers[k][0], y - centers[k][1]) <= R

  const pred = useMemo(() => {
    if (!shade) return null
    // tiny evaluator: names, ∩ (or "and"/"&"), ∪ ("or"/"|"), − ("-", "\"), ' (complement), parentheses
    const src = shade.replace(/\band\b|&|∩/g, '∩').replace(/\bor\b|\||∪/g, '∪').replace(/\\|−/g, '-')
    let i = 0
    const names = sets.map((s) => s.name)
    type P = (x: number, y: number) => boolean
    const atom = (): P => {
      while (src[i] === ' ') i++
      let p: P
      if (src[i] === '(') {
        i++
        p = expr()
        i++
      } else {
        const m = src.slice(i).match(/^\w+/)
        const nm = m ? m[0] : ''
        i += nm.length
        const k = names.indexOf(nm)
        p = nm === universe || nm === 'U' ? () => true : (x, y) => k >= 0 && inside(k, x, y)
      }
      while (src[i] === "'" || src[i] === 'ᶜ') {
        const q = p
        p = (x, y) => !q(x, y)
        i++
      }
      return p
    }
    const expr = (): P => {
      let l = atom()
      while (true) {
        while (src[i] === ' ') i++
        const op = src[i]
        if (op !== '∩' && op !== '∪' && op !== '-') break
        i++
        const r = atom()
        const a = l
        l = op === '∩' ? (x, y) => a(x, y) && r(x, y) : op === '∪' ? (x, y) => a(x, y) || r(x, y) : (x, y) => a(x, y) && !r(x, y)
      }
      return l
    }
    return expr()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shade, body])

  useEffect(() => {
    const c = canvasRef.current
    if (!c || !pred) return
    const ctx = c.getContext('2d')!
    const s = 2
    c.width = W * s
    c.height = H * s
    const img = ctx.createImageData(W * s, H * s)
    for (let py = 0; py < H * s; py++)
      for (let px = 0; px < W * s; px++) {
        const x = px / s, y = py / s
        if (x < 10 || x > W - 10 || y < 10 || y > H - 10) continue
        if (pred(x, y)) {
          const o = (py * W * s + px) * 4
          img.data[o] = 201; img.data[o + 1] = 162; img.data[o + 2] = 39; img.data[o + 3] = 110
        }
      }
    ctx.putImageData(img, 0, 0)
  }, [pred, W, H])

  if (sets.length < 2) return <FigError msg="venn needs at least two sets: A = {..} ; B = {..}" />
  // element placement by region
  const regionOf = (el: string) => sets.slice(0, n).map((s) => s.els.includes(el))
  const all = Array.from(new Set(sets.flatMap((s) => s.els)))
  const groups = new Map<string, string[]>()
  all.forEach((e) => {
    const key = regionOf(e).map(Number).join('')
    groups.set(key, [...(groups.get(key) || []), e])
  })
  const anchor = (key: string): [number, number] => {
    const pts: [number, number][] = []
    for (let y = 20; y < H - 20; y += 6) for (let x = 20; x < W - 20; x += 6) if (centers.slice(0, n).every((_, k) => inside(k, x, y) === (key[k] === '1'))) pts.push([x, y])
    if (!pts.length) return [W / 2, H / 2]
    return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
  }
  return (
    <div className="mn-fig-box">
      <div style={{ position: 'relative', maxWidth: W, margin: '0 auto' }}>
        <canvas ref={canvasRef} className="mn-fade-in" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', animationDelay: '1s' }} />
        <Frame v={{ W, H }}>
          <rect x={10} y={10} width={W - 20} height={H - 20} rx={8} fill="none" stroke="#4F6272" />
          <text x={22} y={32} fontSize="15" fontStyle="italic" fill="#12233C">{universe}</text>
          {centers.slice(0, n).map(([cx, cy], k) => (
            <g key={k}>
              <DPath d={`M${cx + R} ${cy}a${R} ${R} 0 1 0 ${-2 * R} 0a${R} ${R} 0 1 0 ${2 * R} 0`} stroke={PALETTE[k]} width={2} delay={k * 300} />
              <text x={cx + (k === 1 ? R * 0.7 : k === 0 ? -R * 0.85 : 0)} y={k === 2 ? cy + R + 18 : cy - R + 4} fontSize="17" fontStyle="italic" fill={PALETTE[k]} textAnchor="middle">{sets[k].name}</text>
            </g>
          ))}
          {[...groups.entries()].map(([key, els]) => {
            const [x, y] = anchor(key)
            return (
              <text key={key} x={x} y={y} textAnchor="middle" fontSize="14" fill="#12233C" className="mn-pop" style={{ animationDelay: '800ms' }}>
                {els.join(', ')}
              </text>
            )
          })}
        </Frame>
      </div>
      {shade && <p style={{ fontFamily: 'var(--font-sheet)', fontStyle: 'italic', color: '#9C7C15', fontSize: 14, margin: '4px 0 0' }}>shaded: {shade}</p>}
    </div>
  )
}

/* ═════════════ graphs (networks) ═════════════ */
export function Graph({ attrs, body }: { attrs: Record<string, string>; body: string }) {
  const edges: { a: string; b: string; w?: string; dir: boolean }[] = []
  const nodes: string[] = []
  const add = (n: string) => !nodes.includes(n) && nodes.push(n)
  for (const l of lines(body)) {
    const m = l.match(/^(\S+)\s*(->|--|<->)\s*(\S+)(?:\s*:\s*(.+))?$/)
    if (m) {
      add(m[1]); add(m[3])
      edges.push({ a: m[1], b: m[3], w: m[4], dir: m[2] === '->' || (attrs.directed !== undefined && m[2] !== '--') })
    } else add(l.trim())
  }
  const W = 560, H = 380
  const pos: Record<string, [number, number]> = {}
  nodes.forEach((n, k) => {
    const a = -Math.PI / 2 + (2 * Math.PI * k) / nodes.length
    pos[n] = [W / 2 + 150 * Math.cos(a), H / 2 + 140 * Math.sin(a)]
  })
  if (attrs.layout === 'force') {
    for (let it = 0; it < 300; it++) {
      const f: Record<string, [number, number]> = Object.fromEntries(nodes.map((n) => [n, [0, 0]]))
      for (const a of nodes) for (const b of nodes) if (a !== b) {
        const dx = pos[a][0] - pos[b][0], dy = pos[a][1] - pos[b][1], d2 = dx * dx + dy * dy + 0.01
        f[a][0] += (dx / d2) * 2200; f[a][1] += (dy / d2) * 2200
      }
      for (const e of edges) {
        const dx = pos[e.b][0] - pos[e.a][0], dy = pos[e.b][1] - pos[e.a][1]
        f[e.a][0] += dx * 0.02; f[e.a][1] += dy * 0.02; f[e.b][0] -= dx * 0.02; f[e.b][1] -= dy * 0.02
      }
      for (const n of nodes) {
        pos[n][0] = Math.max(40, Math.min(W - 40, pos[n][0] + f[n][0] * 0.5 + (W / 2 - pos[n][0]) * 0.01))
        pos[n][1] = Math.max(40, Math.min(H - 40, pos[n][1] + f[n][1] * 0.5 + (H / 2 - pos[n][1]) * 0.01))
      }
    }
  }
  const r = 19
  return (
    <div className="mn-fig-box">
      <Frame v={{ W, H }}>
        {edges.map((e, k) => {
          const [x1, y1] = pos[e.a], [x2, y2] = pos[e.b]
          const L = Math.hypot(x2 - x1, y2 - y1) || 1
          const ux = (x2 - x1) / L, uy = (y2 - y1) / L
          const self = e.a === e.b
          const d = self ? `M${x1 - 8} ${y1 - r + 2}c-30 -50 46 -50 16 0` : `M${x1 + ux * r} ${y1 + uy * r}L${x2 - ux * (r + 3)} ${y2 - uy * (r + 3)}`
          return (
            <g key={k}>
              <DPath d={d} stroke="#4F6272" width={1.8} marker={e.dir ? 'url(#mn-arrow-navy)' : undefined} delay={k * 140} />
              {e.w && <MathLabel text={`$${e.w}$`} x={(x1 + x2) / 2 - uy * 12} y={(y1 + y2) / 2 + ux * 12 + 4} anchor="middle" size={14} fill="#C0392B" />}
            </g>
          )
        })}
        {nodes.map((n, k) => (
          <g key={n} className="mn-pop" style={{ animationDelay: `${k * 90}ms` }}>
            <circle cx={pos[n][0]} cy={pos[n][1]} r={r} fill="#fff" stroke="#1F5FAD" strokeWidth={2} />
            <MathLabel text={`$${n}$`} x={pos[n][0]} y={pos[n][1] + 5} anchor="middle" size={15} />
          </g>
        ))}
      </Frame>
    </div>
  )
}

/* ═════════════ diagrams: commutative chains + flowcharts ═════════════ */
export function Diagram({ body }: { attrs: Record<string, string>; body: string }) {
  const out: React.ReactNode[] = []
  lines(body).forEach((l, li) => {
    const m = l.match(/^(cd|flow)\s*:\s*(.+)$/)
    if (!m) return
    if (m[1] === 'flow') {
      // A -> "B" -> {C?} -yes-> D
      const parts = m[2].split(/\s*(?:-(\w+)->|->|⟶|→)\s*/)
      const nodes: { t: string; diamond: boolean }[] = []
      const labels: string[] = []
      parts.forEach((p, k) => {
        if (k % 2 === 1) labels.push(p || '')
        else {
          const t = p.trim().replace(/^"|"$/g, '')
          nodes.push({ t: t.replace(/^\{|\}$/g, ''), diamond: /^\{.*\}$/.test(t) })
        }
      })
      out.push(
        <div key={li} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, margin: '8px 0', fontFamily: 'var(--mn-sans, Arial)', fontSize: 13.5 }}>
          {nodes.map((n, k) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {k > 0 && (
                <span style={{ color: '#0B6FA4', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', fontSize: 11 }}>
                  {labels[k - 1] && <em>{labels[k - 1]}</em>}
                  <span style={{ fontSize: 18, lineHeight: 1 }}>⟶</span>
                </span>
              )}
              <span
                className="mn-pop"
                style={{
                  animationDelay: `${k * 160}ms`,
                  padding: n.diamond ? '10px 16px' : '7px 14px',
                  border: `1.6px solid ${n.diamond ? '#C9A227' : '#1F5FAD'}`,
                  background: n.diamond ? '#FFFBEF' : '#F6F9FC',
                  borderRadius: n.diamond ? 4 : 8,
                  transform: n.diamond ? 'rotate(0deg)' : undefined,
                  clipPath: n.diamond ? 'polygon(10% 0, 90% 0, 100% 50%, 90% 100%, 10% 100%, 0 50%)' : undefined,
                }}
              >
                {n.t}
              </span>
            </span>
          ))}
        </div>
      )
      return
    }
    // commutative: "A --f--> B --g--> C ; A --h--> C"
    const chains = m[2].split(';').map((s) => s.trim())
    const order: string[] = []
    const arrows: { a: string; b: string; lab: string }[] = []
    for (const c of chains) {
      const toks = c.split(/\s*--(.*?)-->\s*/)
      for (let k = 0; k < toks.length; k += 2) {
        if (!order.includes(toks[k])) order.push(toks[k])
        if (k + 2 < toks.length) arrows.push({ a: toks[k], b: toks[k + 2], lab: toks[k + 1] })
      }
    }
    const W = Math.max(320, order.length * 150), H = 150
    const X = (n: string) => 60 + order.indexOf(n) * ((W - 120) / Math.max(1, order.length - 1))
    out.push(
      <Frame key={li} v={{ W, H }}>
        {arrows.map((a, k) => {
          const x1 = X(a.a), x2 = X(a.b)
          const skip = Math.abs(order.indexOf(a.b) - order.indexOf(a.a)) > 1
          const d = skip ? `M${x1 + 10} ${70}Q${(x1 + x2) / 2} ${145} ${x2 - 10} ${72}` : `M${x1 + 20} 50L${x2 - 22} 50`
          return (
            <g key={k}>
              <DPath d={d} stroke="#1F5FAD" width={1.7} marker="url(#mn-arrow-blue)" delay={k * 250} />
              <MathLabel text={`$${a.lab}$`} x={(x1 + x2) / 2} y={skip ? 130 : 40} anchor="middle" size={15} fill="#1F5FAD" />
            </g>
          )
        })}
        {order.map((n, k) => <MathLabel key={n} text={`$${n}$`} x={X(n)} y={56} anchor="middle" size={18} bold={k < 0} />)}
      </Frame>
    )
  })
  return <div className="mn-fig-box">{out.length ? out : <FigError msg="diagram needs cd: or flow: lines" />}</div>
}

