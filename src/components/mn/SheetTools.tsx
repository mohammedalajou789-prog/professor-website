'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, List, Minus, Plus, X, Loader2, ChevronsLeftRight, Maximize, Minimize, LogIn } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/context/LangContext'

/**
 * PDF-viewer-like controls for the sheet: zoom the WHOLE sheet (text, maths, figures),
 * fit to width, contents, and download the blank (student) sheet as a real PDF.
 * Lives in the page header; the sheet listens through the --mn-zoom CSS variable.
 */
const KEY = 'mn-zoom'
const MIN = 0.5, MAX = 2.5
const STEPS = [0.5, 0.67, 0.75, 0.85, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2, 2.25, 2.5]

const isPhone = () => document.documentElement.clientWidth <= 720
/** the zoom saved on a computer — ignored on phones */
function readSaved() {
  if (isPhone()) return null
  try { return localStorage.getItem(KEY) } catch { return null }
}

function fitZoom() {
  const w = document.documentElement.clientWidth
  if (w <= 720) return 1 // phones: the page already fills the screen
  const frame = document.querySelector('.mn-zoom-scroll') as HTMLElement | null
  const avail = Math.min((frame?.clientWidth || w - 48) - 8, 1500)
  return Math.max(0.6, Math.min(1.4, Math.floor((avail / 980) * 100) / 100))
}

function applyZoom(z: number) {
  const sheet = document.querySelector('.mn-zoom-wrap') as HTMLElement | null
  // keep the reader on the same line while the sheet grows or shrinks
  let ratio = 0, top = 0
  if (sheet) {
    const r = sheet.getBoundingClientRect()
    top = r.top + window.scrollY
    ratio = r.height ? Math.max(0, Math.min(1, (window.scrollY + 140 - top) / r.height)) : 0
  }
  document.documentElement.style.setProperty('--mn-zoom', String(z))
  if (sheet && window.scrollY > top - 140) {
    requestAnimationFrame(() => {
      const r2 = sheet.getBoundingClientRect()
      const t2 = r2.top + window.scrollY
      window.scrollTo({ top: t2 + ratio * r2.height - 140, behavior: 'instant' as ScrollBehavior })
    })
  }
}

export default function SheetTools({ toc, pdfHref, pdfLogin, solvedPdf, ar, langSwitch }: { toc: { id: string; html: string }[]; pdfHref?: string; /** visitor without an account: the PDF button leads to sign-in */ pdfLogin?: string; /** the doctor's solved PDF (doctor only) */ solvedPdf?: boolean; ar?: boolean; /** bilingual sheet: quick EN / ع switch (= the site language switch) */ langSwitch?: boolean }) {
  const { setLang } = useLang()
  const [zoom, setZoom] = useState(1)
  const phoneManual = useRef<number | null>(null)
  const [fit, setFit] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [canFs, setCanFs] = useState(false)
  const [fs, setFs] = useState(false)
  const L = ar
    ? { contents: 'المحتويات', pdf: solvedPdf ? 'تحميل المحلولة PDF' : 'تحميل الشيت PDF', login: 'سجّل الدخول للتحميل', smaller: 'تصغير', larger: 'تكبير', fit: 'ملء العرض', full: 'ملء الشاشة', exitFull: 'الخروج من ملء الشاشة', failed: 'تعذّر تجهيز الملف، حاول بعد قليل.' }
    : { contents: 'Contents', pdf: solvedPdf ? 'Download solved PDF' : 'Download PDF', login: 'Sign in to download', smaller: 'Zoom out', larger: 'Zoom in', fit: 'Fit width', full: 'Full screen', exitFull: 'Exit full screen', failed: 'Could not prepare the PDF — please try again in a moment.' }

  // initial zoom: on a computer the saved choice (otherwise fit-to-width);
  // on a phone ALWAYS fit the screen — a zoom saved on the computer (e.g. 110 %) must never make
  // the sheet wider than the phone. A zoom picked on the phone lasts only while the page is open.
  useEffect(() => {
    const apply = () => {
      const saved = readSaved()
      const manual = isPhone() && phoneManual.current !== null
      const z = manual ? phoneManual.current! : saved && saved !== 'fit' ? Number(saved) : fitZoom()
      setFit(!manual && (!saved || saved === 'fit'))
      setZoom(z)
      document.documentElement.style.setProperty('--mn-zoom', String(z))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  // full screen (like F11) — hidden where the browser does not allow it (iPhone)
  useEffect(() => {
    setCanFs(!!document.fullscreenEnabled)
    const on = () => setFs(!!document.fullscreenElement)
    on()
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFs = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else
      document.documentElement
        .requestFullscreen({ navigationUI: 'hide' })
        .then(() => {
          // jump straight to the sheet: full screen = only the sheet and its toolbar
          requestAnimationFrame(() => {
            const frame = document.querySelector('.mn-zoom-scroll') as HTMLElement | null
            const bar = document.querySelector('.under-nav.sticky') as HTMLElement | null
            if (!frame) return
            const top = frame.getBoundingClientRect().top + window.scrollY - (bar?.offsetHeight || 0) - 12
            if (window.scrollY < top) window.scrollTo({ top, behavior: 'instant' as ScrollBehavior })
          })
        })
        .catch(() => {})
  }

  const set = useCallback((z: number, asFit = false) => {
    const v = Math.max(MIN, Math.min(MAX, Math.round(z * 100) / 100))
    setZoom(v)
    setFit(asFit)
    if (isPhone()) phoneManual.current = asFit ? null : v // phones: remembered only for this visit
    else try { localStorage.setItem(KEY, asFit ? 'fit' : String(v)) } catch {}
    applyZoom(v)
  }, [])

  const step = (dir: 1 | -1) => {
    const next = dir > 0 ? STEPS.find((s) => s > zoom + 0.001) ?? MAX : [...STEPS].reverse().find((s) => s < zoom - 0.001) ?? MIN
    set(next)
  }

  // keyboard: Ctrl/⌘ + / − zooms the sheet instead of the whole page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.key === '+' || e.key === '=') { e.preventDefault(); step(1) }
      else if (e.key === '-') { e.preventDefault(); step(-1) }
      else if (e.key === '0') { e.preventDefault(); set(fitZoom(), true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' })
    setOpen(false)
  }

  const download = async () => {
    if (!pdfHref || busy) return
    setBusy(true)
    setErr('')
    try {
      // 202 = the PDF is being built for another student at this moment → wait and ask again
      let j: any = {}
      for (let i = 0; i < 8; i++) {
        const r = await fetch(pdfHref, { headers: { accept: 'application/json' } })
        j = await r.json().catch(() => ({}))
        if (r.status === 202 && j.pending) { await new Promise((res) => setTimeout(res, (j.retryAfter || 4) * 1000)); continue }
        if (r.status === 401 && j.login) { window.location.href = `/login?next=${encodeURIComponent(location.pathname + location.search)}`; return }
        if (!r.ok || !j.url) throw new Error(j.step ? `${j.step}: ${j.detail || j.error}` : j.error || 'failed')
        break
      }
      if (!j.url) throw new Error('busy')
      window.location.href = j.url
    } catch (e: any) {
      setErr(`${L.failed}${e?.message ? `\n(${e.message})` : ''}`)
      setTimeout(() => setErr(''), 15000)
    }
    setBusy(false)
  }

  const btn = 'inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-2 transition hover:bg-surface-2 hover:text-ink disabled:opacity-40'
  return (
    <>
      <div className="mn-noprint flex shrink-0 items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5">
        <button type="button" className={btn} onClick={() => step(-1)} disabled={zoom <= MIN} aria-label={L.smaller} title={L.smaller}><Minus size={16} /></button>
        <button type="button" onClick={() => set(fitZoom(), true)} title={L.fit} className={`h-8 min-w-[52px] rounded-md px-1.5 text-[12.5px] font-semibold tabular-nums transition hover:bg-surface-2 ${fit ? 'text-link' : 'text-ink'}`}>
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" className={btn} onClick={() => step(1)} disabled={zoom >= MAX} aria-label={L.larger} title={L.larger}><Plus size={16} /></button>
        <button type="button" className={`${btn} hidden sm:inline-flex`} onClick={() => set(fitZoom(), true)} aria-label={L.fit} title={L.fit}><ChevronsLeftRight size={16} /></button>
        {canFs && (
          <button type="button" className={`${btn} ${fs ? 'bg-surface-2 text-link' : ''}`} onClick={toggleFs} aria-label={fs ? L.exitFull : L.full} title={`${fs ? L.exitFull : L.full} (F11)`}>
            {fs ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>
        )}
        {langSwitch && (
          <button
            type="button"
            onClick={() => setLang(ar ? 'en' : 'ar')}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 font-semibold text-link transition hover:bg-surface-2 ${ar ? 'text-[12.5px]' : 'font-arabic text-[15px]'}`}
            aria-label={ar ? 'Show the sheet in English' : 'اعرض الشيت بالعربية'}
            title={ar ? 'English' : 'العربية'}
          >
            {ar ? 'EN' : 'ع'}
          </button>
        )}
        {toc.length > 0 && (
          <button type="button" className={btn} onClick={() => setOpen(true)} aria-label={L.contents} title={L.contents}><List size={16} /></button>
        )}
      </div>
      {!pdfHref && pdfLogin && (
        <Link href={pdfLogin} title={L.login} className="mn-noprint inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#0B6FA4]/40 bg-sky-soft px-3 text-[13px] font-semibold text-link transition hover:border-[#0B6FA4]">
          <LogIn size={15} />
          <span className="hidden sm:inline">{L.login}</span>
          <span className="sm:hidden">PDF</span>
        </Link>
      )}
      {pdfHref && (
        <button type="button" onClick={download} disabled={busy} className={`mn-noprint relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-white transition disabled:opacity-80 ${solvedPdf ? 'bg-[#0E7C6B] hover:bg-[#0B6A5B]' : 'bg-[#0B6FA4] hover:bg-[#095E8C]'}`}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          <span className="hidden sm:inline">{L.pdf}</span>
          <span className="sm:hidden">PDF</span>
          {err && <span dir="auto" className="absolute end-0 top-full z-50 mt-2 w-72 whitespace-pre-line rounded-lg bg-bad px-3 py-2 text-start text-[12.5px] font-normal text-white shadow-lg">{err}</span>}
        </button>
      )}

      {open && (
        <div className="mn-noprint fixed inset-0 z-[150]" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[70vh] max-w-[640px] overflow-y-auto rounded-t-2xl bg-surface p-5 pb-8 sm:bottom-auto sm:top-24 sm:rounded-2xl" style={{ animation: 'page-in .3s both' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-muted rtl:tracking-normal">{L.contents}</p>
              <button onClick={() => setOpen(false)} className="rounded-full p-1.5 text-ink-2"><X size={18} /></button>
            </div>
            {toc.map((t, i) => (
              <button key={t.id} onClick={() => go(t.id)} className="flex w-full gap-3 border-b border-line py-3 text-start text-[15px] text-ink hover:text-link">
                <span className="font-display italic text-gold-ink">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: t.html }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
