import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const GLYPHS = ['∫', 'Σ', '∂', 'λ', '∇', 'Γ', 'ℒ', 'Dᵅ']

export default function CourseCard({ c, lang, i, badge, href }: { c: any; lang: 'en' | 'ar'; i: number; badge?: React.ReactNode; href?: string }) {
  const name = (lang === 'ar' ? c.name_ar || c.name_en : c.name_en) as string
  const desc = (lang === 'ar' ? c.description_ar || c.description_en : c.description_en) as string | null
  const accent = c.accent || '#1F5FAD'
  return (
    <Link
      href={href || `/courses/${c.slug}`}
      className="reveal group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1.5 hover:border-[#C9A227]/50 hover:shadow-[0_24px_50px_rgba(18,35,60,.12)]"
      style={{ ['--d' as any]: `${(i % 3) * 110}ms` }}
    >
      <div className="relative h-32 overflow-hidden" style={{ background: `linear-gradient(120deg, ${accent} 0%, #0A1B31 120%)` }}>
        <span className="absolute -bottom-6 end-3 font-display text-[120px] italic leading-none text-white/15 transition-transform duration-700 group-hover:-translate-y-2 group-hover:rotate-[-6deg]">
          {GLYPHS[i % GLYPHS.length]}
        </span>
        <svg viewBox="0 0 300 120" className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none" aria-hidden>
          <path d={`M0 ${80 - (i % 3) * 10} C 60 20, 120 110, 180 60 S 260 20, 300 50`} fill="none" stroke="#fff" strokeWidth="1.2" className="draw-path" pathLength={1} style={{ ['--len' as any]: 1 }} />
        </svg>
        <div className="absolute inset-x-5 bottom-3 flex items-center justify-between">
          {c.code && <span dir="ltr" className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold tracking-wide text-white backdrop-blur">{c.code}</span>}
          {badge}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[17px] font-semibold leading-snug text-ink">{name}</h3>
        {desc && <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-ink-2">{desc}</p>}
        <div className="mt-auto flex items-center justify-between pt-4 text-[12.5px] text-muted">
          <span>{[c.semester, c.academic_year].filter(Boolean).join(' · ')}</span>
          <ArrowUpRight size={17} className="text-[#C9A227] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" />
        </div>
      </div>
    </Link>
  )
}
