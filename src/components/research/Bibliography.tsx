'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Check, Download, ExternalLink, Quote } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { bibtex, citation, type Pub } from '@/lib/pubstats'

const T = {
  en: { byYear: 'By year', export: 'Export', bib: 'Download BibTeX (.bib)', copy: 'Cite', copied: 'Copied', papers: 'papers', paper: 'paper', cited: 'cited', type: 'Type', all: 'All' },
  ar: { byYear: 'حسب السنة', export: 'تصدير', bib: 'تنزيل BibTeX (.bib)', copy: 'اقتباس', copied: 'تم النسخ', papers: 'أبحاث', paper: 'بحث', cited: 'اقتباس', type: 'النوع', all: 'الكل' },
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function Bibliography({ pubs }: { pubs: Pub[] }) {
  const { lang } = useLang()
  const t = T[lang]
  const [type, setType] = useState('all')
  const [active, setActive] = useState<number | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const chipsRef = useRef<HTMLDivElement>(null)

  const types = useMemo(() => Array.from(new Set(pubs.map((p) => (p.pub_type || 'article').toLowerCase()))), [pubs])
  const shown = useMemo(() => (type === 'all' ? pubs : pubs.filter((p) => (p.pub_type || 'article').toLowerCase() === type)), [pubs, type])
  const byYear = useMemo(() => {
    const m = new Map<number, Pub[]>()
    for (const p of shown) m.set(p.year, [...(m.get(p.year) || []), p])
    return [...m.entries()].sort((a, b) => b[0] - a[0])
  }, [shown])
  // global descending numbering [N] … [1]
  const numberOf = useMemo(() => {
    const m = new Map<string, number>()
    let n = shown.length
    for (const [, ps] of byYear) for (const p of ps) m.set(p.id, n--)
    return m
  }, [byYear, shown.length])

  useEffect(() => {
    const onScroll = () => {
      let cur: number | null = byYear[0]?.[0] ?? null
      for (const [y] of byYear) {
        const el = document.getElementById(`y${y}`)
        if (el && el.getBoundingClientRect().top < 150) cur = y
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [byYear])

  useEffect(() => {
    const c = chipsRef.current
    const el = c?.querySelector<HTMLElement>(`[data-chip="${active}"]`)
    if (c && el) c.scrollTo({ left: el.offsetLeft - c.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [active])

  const jump = (y: number) => {
    const el = document.getElementById(`y${y}`)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: 'smooth' })
  }

  const copy = async (p: Pub) => {
    try {
      await navigator.clipboard.writeText(citation(p))
      setCopied(p.id)
      setTimeout(() => setCopied(null), 1600)
    } catch {}
  }

  return (
    <div className="mx-auto max-w-[1680px] px-4 sm:px-7 lg:px-12 2xl:px-[72px]">
      {/* mobile year chips */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-line bg-surface/92 backdrop-blur-md lg:hidden">
        <div ref={chipsRef} className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-2.5">
          {byYear.map(([y, ps]) => (
            <button
              key={y}
              data-chip={y}
              onClick={() => jump(y)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition ${active === y ? 'bg-navy text-white' : 'bg-surface-2 text-ink-2'}`}
            >
              <bdi dir="ltr">{y}</bdi>
              <span className={`font-display text-[11px] italic ${active === y ? 'text-[#E3C566]' : 'text-muted'}`}>{ps.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-8 py-6 sm:py-10 xl:gap-10">
        <aside className="card sticky top-[96px] hidden w-[220px] shrink-0 p-5 lg:block">
          <p className="mb-4 text-[11.5px] font-semibold uppercase tracking-[.12em] text-muted rtl:tracking-normal">{t.byYear}</p>
          <nav className="flex max-h-[52vh] flex-col overflow-y-auto pe-2">
            {byYear.map(([y, ps]) => (
              <button
                key={y}
                onClick={() => jump(y)}
                className={`flex items-center justify-between border-s-2 py-1.5 ps-3.5 text-start text-[14px] transition-all ${active === y ? 'border-[#C9A227] text-ink' : 'border-line text-muted hover:text-ink'}`}
              >
                <bdi dir="ltr" className="font-display">{y}</bdi>
                <span className="font-display text-[12.5px] italic text-muted">{ps.length}</span>
              </button>
            ))}
          </nav>
          {types.length > 1 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[.12em] text-muted rtl:tracking-normal">{t.type}</p>
              <div className="flex flex-wrap gap-1.5">
                {['all', ...types].map((x) => (
                  <button key={x} onClick={() => setType(x)} className={`rounded-full px-2.5 py-1 text-[12px] capitalize transition ${type === x ? 'bg-navy text-white' : 'bg-surface text-ink-2 ring-1 ring-line'}`}>
                    {x === 'all' ? t.all : x}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[.12em] text-muted rtl:tracking-normal">{t.export}</p>
            <button onClick={() => download('el-ajou-publications.bib', bibtex(shown))} className="inline-flex items-center gap-2 text-[13.5px] text-ink-2 transition hover:text-ink">
              <Download size={14} /> {t.bib}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-5 pb-10 sm:space-y-7">
          <button onClick={() => download('el-ajou-publications.bib', bibtex(shown))} className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-[13px] text-ink-2 lg:hidden">
            <Download size={14} /> {t.bib}
          </button>
          {byYear.map(([y, ps]) => (
            <section key={y} id={`y${y}`} data-year={y} className="card reveal scroll-mt-32 px-4 pb-2 pt-5 sm:px-8 sm:pt-7">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <bdi dir="ltr" className="font-display text-[clamp(26px,3.6vw,38px)] font-semibold leading-none text-ink">{y}</bdi>
                <span className="text-[12.5px] text-muted">
                  {ps.length} {ps.length === 1 ? t.paper : t.papers}
                </span>
              </div>
              <div className="mb-1 h-px bg-[linear-gradient(to_right,#C9A227_0,#C9A227_56px,var(--c-line)_56px)] rtl:bg-[linear-gradient(to_left,#C9A227_0,#C9A227_56px,var(--c-line)_56px)]" />
              <ol>
                {ps.map((p) => (
                  <li key={p.id} dir="ltr" className="group flex gap-3 border-b border-line py-5 last:border-b-0 sm:gap-5">
                    <span className="w-9 shrink-0 pt-0.5 font-display text-[14.5px] italic text-[#C9A227] sm:w-11">[{numberOf.get(p.id)}]</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] leading-[1.75] text-ink-2 sm:text-[15px]">
                        {p.authors}. <span className="font-medium text-ink">{p.title_en}.</span>{' '}
                        {p.journal_name && <span className="font-display text-[15.5px] italic text-gold-ink">{p.journal_name}</span>}
                        {p.volume && <>, <b className="font-semibold text-ink-2">{p.volume}</b></>}
                        {p.issue && <>({p.issue})</>}
                        {p.pages && <>: {p.pages}</>}. {p.year}.
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        {!!p.citation_count && (
                          <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                            <Quote size={11} /> {p.citation_count} {t.cited}
                          </span>
                        )}
                        <div className="ms-auto flex gap-1.5">
                          <button onClick={() => copy(p)} className="inline-flex items-center gap-1 rounded-[4px] border border-line px-2.5 py-1 text-[12px] text-ink-2 transition hover:border-[#C9A227] hover:text-ink">
                            {copied === p.id ? <Check size={12} className="text-ok" /> : <Copy size={12} />} {copied === p.id ? t.copied : t.copy}
                          </button>
                          {p.doi && (
                            <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-[4px] border border-line px-2.5 py-1 text-[12px] text-ink-2 transition hover:border-[#C9A227] hover:text-ink">
                              DOI <ExternalLink size={11} />
                            </a>
                          )}
                          {p.scholar_url && (
                            <a href={p.scholar_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-[4px] border border-line px-2.5 py-1 text-[12px] text-ink-2 transition hover:border-[#C9A227] hover:text-ink">
                              Scholar
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
