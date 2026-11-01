'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { Search, ChevronDown, ExternalLink, Star, X } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import type { Pub } from '@/lib/pubstats'

const T = {
  en: { ph: 'Search title, author, journal…', all: 'All', results: 'results', abstract: 'Abstract', show: 'Abstract', hide: 'Hide', featured: 'Featured', empty: 'No publication matches your search.', cites: 'citations', clear: 'Clear' },
  ar: { ph: 'ابحث بالعنوان أو المؤلف أو المجلة…', all: 'الكل', results: 'نتيجة', abstract: 'الملخص', show: 'الملخص', hide: 'إخفاء', featured: 'مميّز', empty: 'لا توجد أبحاث مطابقة.', cites: 'اقتباس', clear: 'مسح' },
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>
  const i = text.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[2px] bg-[#C9A227]/25 px-0.5 text-inherit">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}

export default function ResearchLibrary({ pubs }: { pubs: Pub[] }) {
  const { lang } = useLang()
  const t = T[lang]
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q.trim())
  const [decade, setDecade] = useState<string>('all')
  const [open, setOpen] = useState<string | null>(null)

  const decades = useMemo(() => {
    const ds = Array.from(new Set(pubs.map((p) => `${Math.floor(p.year / 5) * 5}`))).sort((a, b) => +b - +a)
    return ds
  }, [pubs])

  const list = useMemo(() => {
    const ql = dq.toLowerCase()
    return pubs.filter((p) => {
      if (decade !== 'all' && `${Math.floor(p.year / 5) * 5}` !== decade) return false
      if (!ql) return true
      return [p.title_en, p.authors, p.journal_name, p.abstract_en, String(p.year)].some((f) => f && f.toLowerCase().includes(ql))
    })
  }, [pubs, dq, decade])

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 mb-6 border-b border-line bg-surface-2 px-4 py-3 sm:mx-0 sm:rounded-xl sm:border sm:px-4">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.ph}
            className="h-12 w-full rounded-lg border border-line bg-surface pe-10 ps-10 text-[15px] text-ink outline-none transition focus:border-[#C9A227] focus:shadow-[0_0_0_4px_rgba(201,162,39,.12)]"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label={t.clear} className="absolute end-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-ink">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="no-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto">
          {['all', ...decades].map((d) => (
            <button
              key={d}
              onClick={() => setDecade(d)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ${decade === d ? 'bg-navy text-white' : 'bg-surface text-ink-2 ring-1 ring-line hover:ring-[#C9A227]/60'}`}
            >
              {d === 'all' ? t.all : <bdi dir="ltr">{`${d}–${+d + 4}`}</bdi>}
            </button>
          ))}
          <span className="ms-auto shrink-0 ps-3 text-[12.5px] text-muted">
            <bdi dir="ltr">{list.length}</bdi> {t.results}
          </span>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-muted">{t.empty}</p>
      ) : (
        <ol className="grid gap-3.5 xl:grid-cols-2">
          {list.map((p, i) => {
            const isOpen = open === p.id
            return (
              <li
                key={p.id}
                className="group relative overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(18,35,60,.04)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#C9A227]/50 hover:shadow-[0_14px_34px_rgba(18,35,60,.09)] sm:p-5"
                style={{ animation: `page-in .5s var(--ease-out) ${Math.min(i, 10) * 35}ms both` }}
              >
                <span className="absolute inset-y-0 start-0 w-[3px] origin-top scale-y-0 bg-[#C9A227] transition-transform duration-500 group-hover:scale-y-100" />
                <div dir="ltr" className="flex gap-4">
                  <div className="hidden w-14 shrink-0 text-center sm:block">
                    <span className="block font-display text-[22px] font-semibold leading-none text-ink">{p.year}</span>
                    {!!p.citation_count && <span className="mt-1.5 block text-[11px] text-muted">{p.citation_count} cit.</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span className="font-display text-[13px] font-semibold text-ink sm:hidden">{p.year}</span>
                      {p.is_featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#C9A227]/12 px-2 py-0.5 text-[10.5px] font-semibold text-gold-ink">
                          <Star size={10} fill="currentColor" /> {t.featured}
                        </span>
                      )}
                      {p.pub_type && p.pub_type !== 'article' && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium capitalize text-ink-2">{p.pub_type}</span>}
                    </div>
                    <h3 className="text-[15.5px] font-semibold leading-[1.5] text-ink sm:text-[16.5px]">
                      <Highlight text={p.title_en} q={dq} />
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-ink-2">
                      <Highlight text={p.authors} q={dq} />
                    </p>
                    {p.journal_name && (
                      <p className="mt-1 font-display text-[14.5px] italic text-gold-ink">
                        <Highlight text={p.journal_name} q={dq} />
                        {p.volume && <span className="not-italic text-muted"> · {p.volume}{p.issue ? `(${p.issue})` : ''}{p.pages ? `, ${p.pages}` : ''}</span>}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {p.abstract_en && (
                        <button
                          onClick={() => setOpen(isOpen ? null : p.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-[12px] text-ink-2 transition hover:border-[#C9A227] hover:text-ink"
                        >
                          {isOpen ? t.hide : t.show}
                          <ChevronDown size={13} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                      {p.doi && (
                        <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-[12px] text-ink-2 transition hover:border-[#C9A227] hover:text-ink">
                          DOI <ExternalLink size={11} />
                        </a>
                      )}
                      {(p.journal_url || p.scholar_url) && (
                        <a href={(p.journal_url || p.scholar_url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1 text-[12px] text-ink-2 transition hover:border-[#C9A227] hover:text-ink">
                          {p.journal_url ? 'Journal' : 'Scholar'} <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                    <div className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <p className="mt-3 border-s-2 border-[#C9A227]/50 ps-3 text-[13.5px] leading-[1.75] text-ink-2">{p.abstract_en}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
