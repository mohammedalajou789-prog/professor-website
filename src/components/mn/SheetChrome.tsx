'use client'

import { useEffect, useRef } from 'react'

/**
 * Reading frame around a sheet: reading-progress bar + the zoom container.
 * The whole sheet is scaled with CSS zoom (--mn-zoom, set by SheetTools) like a PDF viewer;
 * when it is wider than the screen it scrolls sideways inside its own frame.
 */
export default function SheetChrome({ children }: { toc?: { id: string; html: string }[]; mode?: 'student' | 'doctor'; children: React.ReactNode; ar?: boolean }) {
  const frame = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  // phones: the page width follows the frame width (zoom then makes it wider → pan)
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(() => el.style.setProperty('--mn-cw', `${el.clientWidth}px`))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const h = document.documentElement
        // straight to the DOM: no React re-render while scrolling
        if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))})`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div className="relative">
      <div className="mn-noprint under-nav fixed inset-x-0 z-40 h-[3px] bg-transparent">
        <div ref={bar} className="h-full origin-left bg-gradient-to-r from-[#0B6FA4] via-[#1E9BD0] to-[#C9A227] will-change-transform rtl:origin-right" style={{ transform: 'scaleX(0)' }} />
      </div>
      <div ref={frame} className="mn-zoom-scroll">
        <div className="mn-zoom-wrap">{children}</div>
      </div>
    </div>
  )
}
