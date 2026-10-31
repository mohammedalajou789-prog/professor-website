'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Admin-only fallback for a ```pyplot figure that has no stored SVG yet:
 * runs the Python in this browser, shows it, and (upload) stores it so students get it instantly.
 */
export default function PyFigure({ code, hash, upload }: { code: string; hash: string; upload: boolean }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState('Waiting…')
  const [saved, setSaved] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      try {
        const { runPy, scopeSvg } = await import('@/lib/py/client')
        const raw = await runPy(code, (m) => alive && setStatus(m))
        const out = scopeSvg(raw, hash)
        if (!alive) return
        setSvg(out)
        if (upload) {
          const r = await fetch('/api/admin/pyfig', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hash, svg: out }) })
          if (alive) setSaved(r.ok ? 'saved for students ✓' : '')
        }
      } catch (e: any) {
        if (alive) setErr(e?.message || String(e))
      }
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => { alive = false; io.disconnect() }
  }, [code, hash, upload])

  if (err) {
    return (
      <div className="mn-py-error" dir="ltr">
        <strong>Python error</strong>
        <pre>{err}</pre>
      </div>
    )
  }
  if (svg) {
    return (
      <>
        <div className="mn-py-svg" dangerouslySetInnerHTML={{ __html: svg }} />
        {saved && <div className="mn-py-note">{saved}</div>}
      </>
    )
  }
  return (
    <div ref={ref} className="mn-py-loading" dir="ltr">
      <span className="mn-py-spin" aria-hidden />
      <span>{status}</span>
    </div>
  )
}
