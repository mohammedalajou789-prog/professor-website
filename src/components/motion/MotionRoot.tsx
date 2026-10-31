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
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )
    const scan = (root: ParentNode = document) => {
      root.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        if (reduce) el.classList.add('in')
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
    }
  }, [pathname])

  return null
}
