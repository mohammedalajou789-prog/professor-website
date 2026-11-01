'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')
  }, [])
  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const root = document.documentElement
    const apply = () => { root.dataset.theme = next }
    // one cheap cross-fade of the whole screen (no per-element colour transitions → instant even on long sheets)
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (d.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) d.startViewTransition(apply)
    else apply()
    try { localStorage.setItem('theme', next) } catch {}
    setTheme(next)
  }
  return { theme, toggle }
}

/** Sun/moon switch — used in the navbar, the mobile menu and the admin bar. */
export default function ThemeToggle({ className = '', label }: { className?: string; label?: [string, string] }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Light mode' : 'Dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
    >
      <span className="relative block h-[18px] w-[18px]">
        <Sun size={18} className={`absolute inset-0 transition-all duration-500 ${dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
        <Moon size={18} className={`absolute inset-0 transition-all duration-500 ${dark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
      </span>
      {label && <span>{dark ? label[0] : label[1]}</span>}
    </button>
  )
}
