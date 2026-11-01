'use client'

import { useEffect } from 'react'
import { useCleanPath } from '@/lib/usePath'

/**
 * One global IntersectionObserver for every element with the `reveal` class.
 * Server components only need className="reveal" (+ style={{'--d':'120ms'}} for stagger).
 */
export default function MotionRoot() {
  const pathname = useCleanPath()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Only touch elements React has already hydrated: streamed parts of a page (e.g. a lecture
    // behind loading.tsx) hydrate later, and changing their class first causes a hydration mismatch.
    const hydrated = (el: Element) => Object.keys(el).some((k) => k.startsWith('__reactFiber'))
    const timers = new Set<number>()
    const reveal = (el: Element) => {
      if (hydrated(el)) { el.classList.add('in'); return }
      const t = window.setTimeout(() => { timers.delete(t); reveal(el) }, 60)
      timers.add(t)
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target)
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )
    const scan = (root: ParentNode = document) => {
      root.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        if (reduce) reveal(el)
        else io.observe(el)
      })
    }
    scan()
    const mo = new MutationObserver((muts) => {
      for (const m of muts) m.addedNodes.forEach((n) => n instanceof HTMLElement && scan(n.parentNode || document))
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
      timers.forEach((t) => clearTimeout(t))
    }
  }, [pathname])

  return null
}
