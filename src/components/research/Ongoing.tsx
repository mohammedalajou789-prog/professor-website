import { Hourglass, ExternalLink } from 'lucide-react'
import type { Pub } from '@/lib/pubstats'

const STAGE: Record<string, [string, string, string]> = {
  accepted: ['Accepted · in press', 'مقبول للنشر', '#0E7C6B'],
  under_review: ['Under review', 'قيد التحكيم', '#1E9BD0'],
  in_preparation: ['In preparation', 'قيد الإعداد', '#C9A227'],
}

/** Ongoing research (not published yet) — shown above the bibliography. */
export default function Ongoing({ pubs, lang }: { pubs: Pub[]; lang: 'en' | 'ar' }) {
  if (!pubs.length) return null
  const ar = lang === 'ar'
  return (
    <section className="mx-auto max-w-[1680px] px-4 pt-6 sm:px-7 sm:pt-10 lg:px-12 2xl:px-[72px]">
      <div className="card reveal relative overflow-hidden p-5 sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -top-8 end-4 select-none font-display text-[130px] italic leading-none text-[#C9A227]/10">…</span>
        <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[.12em] text-gold-ink rtl:tracking-normal"><Hourglass size={14} /> {ar ? 'أعمال قيد الإنجاز' : 'Work in progress'}</p>
        <h2 className="font-display text-[clamp(22px,3.2vw,32px)] font-semibold leading-tight text-ink rtl:font-arabic">{ar ? 'أبحاث جارية' : 'Ongoing research'}</h2>
        <div className="bar2 mt-3" />
        <ol className="mt-5 grid gap-3 lg:grid-cols-2">
          {pubs.map((p) => {
            const [en, a, tone] = STAGE[p.status || ''] || STAGE.under_review
            return (
              <li key={p.id} dir="ltr" className="relative flex gap-3.5 overflow-hidden rounded-xl border border-line bg-surface-2 p-4 transition hover:border-[#C9A227]/50">
                <span className="absolute inset-y-0 start-0 w-[3px]" style={{ background: tone }} />
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: `${tone}1f`, color: tone }}>
                  <Hourglass size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium leading-snug text-ink">{p.title_en}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{p.authors}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="rounded-full px-2.5 py-0.5 font-semibold" style={{ background: `${tone}1f`, color: tone }}>{ar ? a : en}</span>
                    {p.journal_name && <span className="font-display italic text-gold-ink">{p.journal_name}</span>}
                    <span className="text-muted">{p.year}</span>
                    {p.doi && (
                      <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="ms-auto inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-ink-2 hover:border-[#C9A227]">
                        DOI <ExternalLink size={11} />
                      </a>
                    )}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
