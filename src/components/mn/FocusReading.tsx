'use client'

import { useEffect } from 'react'

/**
 * Reading focus for sheet pages: the site / admin top bar slides away while the reader scrolls
 * DOWN and comes back as soon as they scroll UP (like a PDF reader on a phone).
 * In full screen the bar stays hidden. Bars opt in with the `site-nav` class;
 * sticky toolbars use `under-nav` so they move up into the freed space.
 */
export default function FocusReading() {
  useEffect(() => {
    const html = document.documentElement
    html.dataset.focus = '1'
    let last = window.scrollY
    let raf = 0
    const set = (hide: boolean) => {
      if (hide) html.dataset.navHidden = '1'
      else delete html.dataset.navHidden
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        if (document.fullscreenElement) set(true)
        else if (y < 80) set(false)
        else if (y > last + 6) set(true)
        else if (y < last - 6) set(false)
        last = y
      })
    }
    const onFs = () => {
      if (document.fullscreenElement) html.dataset.fs = '1'
      else delete html.dataset.fs
      set(!!document.fullscreenElement || window.scrollY > 80)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('fullscreenchange', onFs)
      cancelAnimationFrame(raf)
      delete html.dataset.focus
      delete html.dataset.navHidden
      delete html.dataset.fs
    }
  }, [])
  return null
}
