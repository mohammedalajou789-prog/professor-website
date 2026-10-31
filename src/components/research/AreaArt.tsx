/**
 * Small animated mathematical illustrations for research areas.
 * Pure SVG (server-rendered), curves "draw" themselves when revealed.
 */
type Kind = 'fractional' | 'phase' | 'model' | 'numeric' | 'special' | 'fuzzy' | 'matrix' | 'wave'

const ALL: Kind[] = ['fractional', 'phase', 'model', 'numeric', 'special', 'fuzzy', 'matrix', 'wave']

/** one distinct illustration per card: the best match first, otherwise the next unused one */
export function assignKinds(names: string[]): Kind[] {
  const used = new Set<Kind>()
  return names.map((n, i) => {
    let k = areaKind(n, i)
    if (used.has(k)) {
      const n2 = n.toLowerCase()
      // a second "fractional" area that is about equations → phase portrait
      if (k === 'fractional' && /equation|معادل/.test(n2) && !used.has('phase')) k = 'phase'
      else k = ALL.find((x) => !used.has(x)) || k
    }
    used.add(k)
    return k
  })
}

export function areaKind(name: string, i: number): Kind {
  const n = name.toLowerCase()
  if (/fraction|كسري/.test(n)) return 'fractional'
  if (/fuzzy|ضباب/.test(n)) return 'fuzzy'
  if (/numer|عدد/.test(n)) return 'numeric'
  if (/model|نمذج/.test(n)) return 'model'
  if (/special|خاص/.test(n)) return 'special'
  if (/matri|مصفوف/.test(n)) return 'matrix'
  if (/differential|تفاضل/.test(n)) return 'phase'
  return (['wave', 'phase', 'model', 'special'] as Kind[])[i % 4]
}

const W = 200, H = 120
const sx = (x: number, x0: number, x1: number) => 10 + ((x - x0) / (x1 - x0)) * (W - 20)
const sy = (y: number, y0: number, y1: number) => H - 12 - ((y - y0) / (y1 - y0)) * (H - 24)
function path(f: (x: number) => number, x0: number, x1: number, y0: number, y1: number, n = 80) {
  let d = ''
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    const y = Math.max(y0 - 1, Math.min(y1 + 1, f(x)))
    d += `${i ? 'L' : 'M'}${sx(x, x0, x1).toFixed(1)} ${sy(y, y0, y1).toFixed(1)}`
  }
  return d
}
const gamma = (z: number): number => {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z))
  z -= 1
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  let x = c[0]
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i)
  const t = z + g + 0.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
}
const ml = (a: number, z: number) => {
  let s = 0
  for (let k = 0; k < 60; k++) {
    const t = Math.pow(z, k) / gamma(a * k + 1)
    if (!isFinite(t)) break
    s += t
  }
  return s
}

function Curves({ ds, colors }: { ds: string[]; colors?: string[] }) {
  return (
    <>
      {ds.map((d, i) => (
        <path key={i} d={d} className="draw-path" pathLength={1} style={{ ['--len' as any]: 1, ['--d' as any]: `${i * 180}ms`, stroke: colors?.[i] || 'var(--art-gold)' }} fill="none" strokeWidth={1.8} strokeLinecap="round" opacity={1 - i * 0.12} />
      ))}
    </>
  )
}

export default function AreaArt({ kind }: { kind: Kind }) {
  let body: React.ReactNode = null
  const navy = 'var(--art-ink)', blue = 'var(--art-blue)', gold = 'var(--art-gold)', red = 'var(--art-red)'
  switch (kind) {
    case 'fractional': {
      // D^α of t : t^{1-α}/Γ(2-α) for several α
      const as = [0, 0.25, 0.5, 0.75]
      body = <Curves ds={as.map((a) => path((t) => Math.pow(t, 1 - a) / gamma(2 - a), 0, 2, 0, 2.2))} colors={[navy, blue, gold, red]} />
      break
    }
    case 'special': {
      const as = [0.5, 0.8, 1]
      body = <Curves ds={as.map((a) => path((t) => ml(a, -t * t * 0.6), 0, 4, -0.4, 1.05))} colors={[gold, blue, navy]} />
      break
    }
    case 'model':
      body = <Curves ds={[path((t) => 1 / (1 + 9 * Math.exp(-1.4 * t)), 0, 6, 0, 1.05), path((t) => 0.6 / (1 + 9 * Math.exp(-1.0 * t)), 0, 6, 0, 1.05)]} colors={[gold, blue]} />
      break
    case 'numeric': {
      const f = (t: number) => Math.exp(-t) * Math.cos(2 * t) * 0.9
      let d = '', y = f(0), x = 0
      const h = 0.35
      d = `M${sx(0, 0, 4)} ${sy(y, -1, 1)}`
      while (x < 4) {
        const dy = -Math.exp(-x) * (Math.cos(2 * x) + 2 * Math.sin(2 * x)) * 0.9
        x += h
        y += h * dy
        d += `L${sx(x, 0, 4).toFixed(1)} ${sy(y, -1, 1).toFixed(1)}`
      }
      body = (
        <>
          <Curves ds={[path(f, 0, 4, -1, 1), d]} colors={[navy, gold]} />
          {Array.from({ length: 12 }, (_, i) => i * h).map((t) => (
            <circle key={t} cx={sx(t, 0, 4)} cy={sy(f(t), -1, 1)} r={1.8} className="reveal" style={{ fill: blue, ['--d' as any]: `${t * 300}ms` }} />
          ))}
        </>
      )
      break
    }
    case 'fuzzy':
      body = <Curves ds={['M20 108 L70 20 L120 108', 'M70 108 L120 20 L170 108', 'M10 108 L40 108 L75 40 L110 108']} colors={[gold, blue, navy]} />
      break
    case 'matrix':
      body = (
        <g fontFamily="var(--font-display)" fontStyle="italic" fontSize="15" style={{ fill: navy }}>
          <path d="M44 16 q-10 44 0 88 M156 16 q10 44 0 88" strokeWidth="1.6" fill="none" className="draw-path" pathLength={1} style={{ ['--len' as any]: 1, stroke: gold }} />
          {['a₁₁ a₁₂ a₁₃', 'a₂₁ a₂₂ a₂₃', 'a₃₁ a₃₂ a₃₃'].map((r, i) => (
            <text key={i} x="100" y={40 + i * 28} textAnchor="middle" className="reveal" style={{ ['--d' as any]: `${200 + i * 160}ms` }}>
              {r}
            </text>
          ))}
        </g>
      )
      break
    case 'phase': {
      const ds: string[] = []
      for (const [x0, y0] of [[1.8, 0], [-1.8, 0], [0, 1.6], [0, -1.6]]) {
        let x = x0, y = y0, d = ''
        for (let i = 0; i < 260; i++) {
          d += `${i ? 'L' : 'M'}${(100 + x * 45).toFixed(1)} ${(60 - y * 30).toFixed(1)}`
          const dx = -0.18 * x - y, dy = x - 0.18 * y
          x += dx * 0.04
          y += dy * 0.04
        }
        ds.push(d)
      }
      body = (
        <>
          <Curves ds={ds} colors={[gold, blue, navy, red]} />
          <circle cx="100" cy="60" r="2.4" style={{ fill: navy }} />
        </>
      )
      break
    }
    default:
      body = <Curves ds={[path((t) => Math.sin(t), 0, 12, -1.2, 1.2), path((t) => 0.6 * Math.sin(1.5 * t + 1), 0, 12, -1.2, 1.2)]} colors={[gold, blue]} />
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" aria-hidden>
      <g style={{ stroke: 'var(--art-axis)' }} strokeWidth="1">
        <line x1="10" y1={H - 12} x2={W - 10} y2={H - 12} />
        <line x1="10" y1="10" x2="10" y2={H - 12} />
      </g>
      {body}
    </svg>
  )
}
