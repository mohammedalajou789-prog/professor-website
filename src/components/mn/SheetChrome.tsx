'use client'

import { useEffect, useState } from 'react'
import { Download, List, Minus, Plus, X, Loader2 } from 'lucide-react'

/**
 * Reading frame around a sheet: the sheet is always centred and dominant;
 * contents sit in the free margin on very wide screens, otherwise in a drawer.
 * Floating toolbar: text size, contents, PDF download.
 */
export default function SheetChrome({ toc, children, pdfHref, ar }: { toc: { id: string; html: string }[]; mode: 'student' | 'doctor'; children: React.ReactNode; pdfHref?: string; ar?: boolean }) {
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState<string | null>(toc[0]?.id ?? null)
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [pdfBusy, setPdfBusy] = useState(false)
  const L = ar
    ? { contents: 'المحتويات', pdf: 'تحميل PDF', preparing: 'جارٍ تجهيز الملف…', smaller: 'تصغير الخط', larger: 'تكبير الخط' }
    : { contents: 'Contents', pdf: 'Download PDF', preparing: 'Preparing your PDF…', smaller: 'Smaller text', larger: 'Larger text' }

  useEffect(() => {
    try {
      const s = Number(localStorage.getItem('mn-scale'))
      if (s) setScale(s)
    } catch {}
    const onScroll = () => {
      const h = document.documentElement
      setProgress(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)))
      let cur = toc[0]?.id ?? null
      for (const t of toc) {
        const el = document.getElementById(t.id)
        if (el && el.getBoundingClientRect().top < 160) cur = t.id
      }
      setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    // fallback from the PDF route: open the browser's print dialog (Save as PDF)
    if (new URLSearchParams(location.search).get('print') === '1') {
      document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'))
      setTimeout(() => window.print(), 1200)
    }
    return () => window.removeEventListener('scroll', onScroll)
  }, [toc])

  const setS = (v: number) => {
    const s = Math.max(0.85, Math.min(1.3, Math.round(v * 100) / 100))
    setScale(s)
    try {
      localStorage.setItem('mn-scale', String(s))
    } catch {}
  }

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' })
    setOpen(false)
  }

  const downloadPdf = () => {
    if (!pdfHref || pdfBusy) return
    setPdfBusy(true)
    // the route answers with a redirect to the file (or to the print fallback)
    window.location.href = pdfHref
    setTimeout(() => setPdfBusy(false), 9000)
  }

  const Toc = ({ big }: { big?: boolean }) => (
    <nav className={big ? '' : 'space-y-0.5 border-s border-line'}>
      {toc.map((t, i) =>
        big ? (
          <button key={t.id} onClick={() => go(t.id)} className={`flex w-full gap-3 border-b border-line py-3 text-start text-[15px] ${active === t.id ? 'font-semibold text-link' : 'text-ink'}`}>
            <span className="font-display italic text-gold-ink">{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: t.html }} />
          </button>
        ) : (
          <button
            key={t.id}
            onClick={() => go(t.id)}
            className={`-ms-px block w-full border-s-2 py-1.5 ps-3 text-start text-[13px] leading-snug transition ${active === t.id ? 'border-link font-semibold text-link' : 'border-transparent text-ink-2 hover:text-ink'}`}
            dangerouslySetInnerHTML={{ __html: t.html }}
          />
        ),
      )}
    </nav>
  )

  return (
    <div className="relative">
      <div className="mn-noprint fixed inset-x-0 top-16 z-40 h-[3px] bg-transparent">
        <div className="h-full origin-left bg-gradient-to-r from-[#0B6FA4] via-[#1E9BD0] to-[#C9A227] rtl:origin-right" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {/* sheet centred and dominant; contents use the free margin on very wide screens only */}
      <div className="relative">
        {toc.length > 0 && (
          <div className="mn-noprint pointer-events-none absolute inset-y-0 hidden min-[1560px]:block" style={{ insetInlineEnd: 'calc(50% + 490px + 24px)' }}>
            <aside className="card pointer-events-auto sticky top-36 w-[230px] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.14em] text-muted rtl:tracking-normal">{L.contents}</p>
              <Toc />
            </aside>
          </div>
        )}
        <div className="mx-auto w-full min-w-0 max-w-[980px]" style={{ ['--mn-scale' as any]: scale }}>
          {children}
        </div>
      </div>

      {/* floating toolbar */}
      <div className="mn-noprint fixed bottom-4 end-4 z-40 flex items-center gap-1 rounded-full border border-line bg-surface/95 p-1 shadow-[var(--c-shadow-lg)] backdrop-blur">
        <button aria-label={L.smaller} title={L.smaller} onClick={() => setS(scale - 0.05)} className="rounded-full p-2 text-ink-2 hover:bg-surface-2"><Minus size={16} /></button>
        <span className="w-10 text-center text-[11.5px] tabular-nums text-muted">{Math.round(scale * 100)}%</span>
        <button aria-label={L.larger} title={L.larger} onClick={() => setS(scale + 0.05)} className="rounded-full p-2 text-ink-2 hover:bg-surface-2"><Plus size={16} /></button>
        {toc.length > 0 && (
          <button aria-label={L.contents} title={L.contents} onClick={() => setOpen(true)} className="rounded-full p-2 text-ink-2 hover:bg-surface-2 min-[1560px]:hidden"><List size={16} /></button>
        )}
        {pdfHref && (
          <button onClick={downloadPdf} className="ms-0.5 inline-flex items-center gap-1.5 rounded-full bg-[#0B6FA4] px-3.5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#095E8C]">
            {pdfBusy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span className="hidden sm:inline">{pdfBusy ? L.preparing : L.pdf}</span>
            <span className="sm:hidden">PDF</span>
          </button>
        )}
      </div>

      {open && (
        <div className="mn-noprint fixed inset-0 z-[150]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[70vh] max-w-[640px] overflow-y-auto rounded-t-2xl bg-surface p-5 pb-8" style={{ animation: 'page-in .3s both' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted rtl:tracking-normal">{L.contents}</p>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-ink-2"><X size={18} /></button>
            </div>
            <Toc big />
          </div>
        </div>
      )}
    </div>
  )
}
