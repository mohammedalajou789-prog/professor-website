/**
 * Publications-per-year chart on a dark "blackboard": sky-blue bars, gold cumulative curve,
 * grid lines, value labels — everything animates when it scrolls into view.
 */
export default function OutputChart({ perYear, lang }: { perYear: Record<number, number>; lang: 'en' | 'ar' }) {
  const years = Object.keys(perYear).map(Number).sort((a, b) => a - b)
  if (years.length < 2) return null
  const span = Array.from({ length: years[years.length - 1] - years[0] + 1 }, (_, i) => years[0] + i)
  const vals = span.map((y) => perYear[y] || 0)
  const max = Math.max(1, ...vals)
  const top = Math.ceil(max / 5) * 5 || 5
  const total = vals.reduce((a, b) => a + b, 0)
  const peakI = vals.indexOf(max)
  const cum = vals.reduce<number[]>((a, v) => [...a, (a[a.length - 1] || 0) + v], [])

  const W = Math.max(720, span.length * 56), H = 330, L = 40, R = 46, T = 24, B = 40
  const cw = (W - L - R) / span.length
  const bx = (i: number) => L + i * cw + cw * 0.18
  const bw = cw * 0.64
  const yv = (v: number) => H - B - (v / top) * (H - T - B)
  const yc = (v: number) => H - B - (v / total) * (H - T - B)
  const line = cum.map((c, i) => `${i ? 'L' : 'M'}${(L + i * cw + cw / 2).toFixed(1)} ${yc(c).toFixed(1)}`).join('')
  const ar = lang === 'ar'
  const stats = [
    [String(total), ar ? 'إجمالي المنشورات' : 'Total papers'],
    [String(span[peakI]), ar ? `سنة الذروة (${max})` : `Peak year (${max})`],
    [(total / span.length).toFixed(1), ar ? 'متوسط سنوي' : 'Per year, average'],
    [`${span[0]}–${span[span.length - 1]}`, ar ? 'الفترة' : 'Span'],
  ]

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_260px]">
      <div className="reveal no-scrollbar overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1F38]/70 p-3 backdrop-blur-sm sm:p-5" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 640, width: '100%', height: 'auto' }} role="img" aria-label="Publications per year">
          <defs>
            <linearGradient id="oc-bar" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#0B6FA4" />
              <stop offset="1" stopColor="#38C3F0" />
            </linearGradient>
            <linearGradient id="oc-peak" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#9C7C15" />
              <stop offset="1" stopColor="#F3DC8E" />
            </linearGradient>
          </defs>
          {Array.from({ length: 6 }, (_, k) => (top * k) / 5).map((v) => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={yv(v)} y2={yv(v)} stroke="rgba(255,255,255,.08)" strokeDasharray={v ? '3 5' : undefined} />
              <text x={L - 8} y={yv(v) + 4} textAnchor="end" fontSize="11" fill="#8C9BB2">{v}</text>
            </g>
          ))}
          <text x={W - R + 8} y={T + 4} fontSize="10.5" fill="#C9A227">Σ {total}</text>
          {vals.map((v, i) => (
            <g key={span[i]} className="group">
              <rect
                x={bx(i)} y={yv(v)} width={bw} height={Math.max(0, H - B - yv(v))} rx={4}
                fill={i === peakI ? 'url(#oc-peak)' : 'url(#oc-bar)'}
                className="anim"
                style={{ transformBox: 'fill-box', transformOrigin: 'bottom', animation: `bar-grow 1s var(--ease-out) ${i * 55}ms both` }}
              />
              {v > 0 && (
                <text x={bx(i) + bw / 2} y={yv(v) - 7} textAnchor="middle" fontSize="12" fontWeight="600" fill={i === peakI ? '#F3DC8E' : '#DCE5F0'} className="mn-fade-in" style={{ animationDelay: `${600 + i * 55}ms` }}>
                  {v}
                </text>
              )}
              <text x={bx(i) + bw / 2} y={H - B + 18} textAnchor="middle" fontSize="11" fill="#8C9BB2">
                {span.length > 16 ? `’${String(span[i]).slice(2)}` : span[i]}
              </text>
            </g>
          ))}
          <path d={line} fill="none" stroke="#C9A227" strokeWidth="2" strokeLinejoin="round" className="draw-path" pathLength={1} style={{ ['--len' as any]: 1, ['--d' as any]: '500ms' }} />
          {cum.map((c, i) => (
            <circle key={i} cx={L + i * cw + cw / 2} cy={yc(c)} r={2.6} fill="#0A1B31" stroke="#C9A227" strokeWidth="1.5" className="mn-pop" style={{ animationDelay: `${900 + i * 50}ms` }} />
          ))}
          <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="rgba(255,255,255,.35)" />
        </svg>
        <div className="mt-2 flex flex-wrap gap-4 px-2 text-[12px] text-[#AEBBCC]">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#12A4D9]" /> {ar ? 'منشورات السنة' : 'Papers per year'}</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-[2px] w-4 bg-[#C9A227]" /> {ar ? 'المجموع التراكمي' : 'Cumulative total'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
        {stats.map(([v, l], i) => (
          <div key={l} className="reveal rounded-xl border border-white/10 bg-white/[.04] p-4" style={{ ['--d' as any]: `${i * 90}ms` }}>
            <bdi dir="ltr" className="block font-display text-[28px] font-semibold leading-none text-white">{v}</bdi>
            <span className="mt-1.5 block text-[12.5px] text-muted">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
