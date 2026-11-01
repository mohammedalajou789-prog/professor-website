'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCleanPath } from '@/lib/usePath'
import { Menu, X, GraduationCap, Globe } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import type { Brand } from './types'
import ThemeToggle from '@/components/ui/ThemeToggle'
import Logo from '@/components/ui/Logo'

const LINKS = {
  en: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/research', label: 'Research' },
    { href: '/publications', label: 'Publications' },
    { href: '/courses', label: 'Courses' },
    { href: '/contact', label: 'Contact' },
  ],
  ar: [
    { href: '/', label: 'الرئيسية' },
    { href: '/about', label: 'السيرة' },
    { href: '/research', label: 'الأبحاث' },
    { href: '/publications', label: 'المنشورات' },
    { href: '/courses', label: 'المساقات' },
    { href: '/contact', label: 'تواصل' },
  ],
}

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
}

export default function Navbar({ brand }: { brand: Brand }) {
  const { lang, setLang, isRTL } = useLang()
  const pathname = useCleanPath()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // cheap auth hint: Supabase stores the session in an "sb-…-auth-token" cookie
  useEffect(() => {
    setLoggedIn(/(^|;\s*)sb-[^=]+-auth-token/.test(document.cookie))
  }, [pathname])

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (pathname.startsWith('/admin') || pathname.startsWith('/print')) return null

  const links = LINKS[lang]
  const name = isRTL ? brand.name_ar : brand.name_en
  const title = isRTL ? brand.title_ar : brand.title_en
  const account = loggedIn
    ? { href: '/dashboard', label: isRTL ? 'لوحتي' : 'My Courses' }
    : { href: '/login', label: isRTL ? 'تسجيل الدخول' : 'Sign in' }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] h-16 transition-[background,box-shadow,border-color] duration-300 ${
          scrolled ? 'bg-deep shadow-[0_8px_30px_rgba(0,0,0,.35)] border-b border-[#C9A227]/20' : 'bg-deep border-b border-white/[.06]'
        }`}
      >
        <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-12 2xl:px-[72px]">
          <Link href="/" className="group flex min-w-0 items-center gap-3" prefetch>
            <Logo className="h-10 w-10 shrink-0 transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className={`truncate text-[14px] font-semibold text-white ${isRTL ? 'font-arabic' : 'font-display text-[15.5px]'}`}>{name}</span>
              <span className="truncate text-[11.5px] text-[#C9A227]">{title}</span>
            </span>
          </Link>

          <nav className="hidden items-center lg:flex" aria-label="Main">
            {links.map((l) => {
              const active = isActive(pathname, l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  prefetch
                  className={`relative px-3.5 py-5 text-[13.5px] transition-colors ${active ? 'font-semibold text-[#E3C566]' : 'text-[#C4CFDE] hover:text-white'}`}
                >
                  {l.label}
                  <span
                    className={`absolute inset-x-3 bottom-3 h-[2px] origin-center rounded bg-[#C9A227] transition-transform duration-300 ${active ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </Link>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={account.href}
              prefetch={false}
              className="hidden items-center gap-1.5 rounded-md bg-[#C9A227] px-3.5 py-2 text-[13px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A] sm:inline-flex"
            >
              <GraduationCap size={15} />
              {account.label}
            </Link>
            <ThemeToggle className="h-[38px] w-[38px] rounded-md border border-white/25 text-white transition hover:border-[#C9A227] hover:text-[#E3C566]" />
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="rounded-md border border-white/25 px-3 py-2 text-[13px] text-white transition hover:border-[#C9A227] hover:text-[#E3C566]"
            >
              {lang === 'en' ? 'عربي' : 'English'}
            </button>
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-white lg:hidden">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>
      <div className="h-16" aria-hidden />

      {/* Mobile drawer */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[200] bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        className={`fixed bottom-0 top-0 z-[201] flex w-[min(84vw,320px)] flex-col bg-[#0B1A2E] shadow-2xl transition-transform duration-[380ms] ease-[cubic-bezier(.22,1,.36,1)] lg:hidden ${
          isRTL ? 'left-0 border-r' : 'right-0 border-l'
        } border-[#C9A227]/20 ${open ? 'translate-x-0' : isRTL ? '-translate-x-full' : 'translate-x-full'}`}
        aria-hidden={!open}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/[.07] px-5">
          <span className={`text-[13px] font-semibold text-white ${isRTL ? 'font-arabic' : 'font-display text-[15px]'}`}>{name}</span>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg border border-white/10 bg-white/5 p-2 text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {links.map((l, i) => {
            const active = isActive(pathname, l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                style={{ transitionDelay: open ? `${60 + i * 40}ms` : '0ms' }}
                className={`flex items-center gap-3 border-s-[3px] px-6 py-3.5 text-[15.5px] transition-all duration-500 ${
                  open ? 'translate-x-0 opacity-100' : (isRTL ? '-translate-x-4' : 'translate-x-4') + ' opacity-0'
                } ${active ? 'border-[#C9A227] bg-[#C9A227]/[.08] font-semibold text-[#E3C566]' : 'border-transparent text-[#C4CFDE]'}`}
              >
                <span className="font-display text-[12px] italic text-[#C9A227]/70">{String(i + 1).padStart(2, '0')}</span>
                {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-2.5 border-t border-white/[.07] p-4">
          <Link href={account.href} prefetch={false} className="flex items-center justify-center gap-2 rounded-lg bg-[#C9A227] py-3 text-[14.5px] font-semibold text-[#0A1A30]">
            <GraduationCap size={17} /> {account.label}
          </Link>
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C9A227]/35 bg-[#C9A227]/10 py-3 text-[14px] text-white"
          >
            <Globe size={16} /> {lang === 'en' ? 'عربي' : 'English'}
          </button>
          <ThemeToggle
            label={isRTL ? ['الوضع النهاري', 'الوضع الليلي'] : ['Light mode', 'Dark mode']}
            className="w-full rounded-lg border border-white/15 bg-white/5 py-3 text-[14px] text-white"
          />
        </div>
      </aside>
    </>
  )
}
