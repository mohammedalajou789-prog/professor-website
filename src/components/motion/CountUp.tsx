'use client'

import { useEffect, useRef, useState } from 'react'

/** Animates the first number inside `value` ("31+", "Top 2%", "1,240") when it scrolls into view. */
export default function CountUp({ value, duration = 1400 }: { value: string | number; duration?: number }) {
  const str = String(value)
  const m = str.match(/(\d[\d,]*)/)
  const target = m ? parseInt(m[1].replace(/,/g, ''), 10) : NaN
  const [n, setN] = useState<number | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!m || !ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 4)
        setN(Math.round(target * eased))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      setN(0)
      raf = requestAnimationFrame(tick)
    })
    io.observe(ref.current)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [str])

  if (!m) return <span ref={ref}>{str}</span>
  const shown = n === null ? str : str.replace(m[1], n.toLocaleString('en-US'))
  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{shown}</span>
}
