'use client'

import { useEffect } from 'react'

/** Tells the PDF renderer when every font and figure of the sheet is on the page. */
export default function PrintReady() {
  useEffect(() => {
    let alive = true
    document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'))
    const done = async () => {
      try { await (document as any).fonts?.ready } catch {}
      const t0 = Date.now()
      // client figures load lazily; wait until no skeleton is left (max 15 s)
      while (alive && Date.now() - t0 < 15000) {
        const pending = document.querySelectorAll('.mn-fig-box[style*="shimmer"], .mn-py-loading').length
        if (!pending) break
        await new Promise((r) => setTimeout(r, 200))
      }
      document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in'))
      await new Promise((r) => setTimeout(r, 700))
      ;(window as any).__mnPrintReady = true
    }
    done()
    return () => { alive = false }
  }, [])
  return null
}
