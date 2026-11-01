'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, User, FileText, BookOpen, Newspaper, GraduationCap, Briefcase, Award, Globe, Users, Mic, UserCheck,
  School, Sigma, LogOut, Menu, X, ChevronDown, Eye, MonitorSmartphone,
} from 'lucide-react'
import { useCleanPath } from '@/lib/usePath'
import { signOutAll } from '@/lib/role'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'

type Item = { href: string; label: string; ar: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const MAIN: Item[] = [
  { href: '/admin/dashboard', label: 'Overview', ar: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Courses & students', ar: 'المساقات والطلاب', icon: School },
  { href: '/admin/mn-guide', label: 'Sheet guide', ar: 'دليل الشيتات', icon: Sigma },
]
const CONTENT: Item[] = [
  { href: '/admin/dashboard?s=profile', label: 'Profile', ar: 'الملف الشخصي', icon: User },
  { href: '/admin/dashboard?s=publications', label: 'Publications', ar: 'المنشورات', icon: FileText },
  { href: '/admin/dashboard?s=interests', label: 'Research areas', ar: 'مجالات البحث', icon: BookOpen },
  { href: '/admin/dashboard?s=news', label: 'News & activities', ar: 'الأخبار', icon: Newspaper },
  { href: '/admin/dashboard?s=education', label: 'Education', ar: 'التعليم', icon: GraduationCap },
  { href: '/admin/dashboard?s=positions', label: 'Positions', ar: 'المناصب', icon: Briefcase },
  { href: '/admin/dashboard?s=awards', label: 'Awards', ar: 'الجوائز', icon: Award },
  { href: '/admin/dashboard?s=memberships', label: 'Memberships', ar: 'العضويات', icon: Globe },
  { href: '/admin/dashboard?s=committees', label: 'Committees', ar: 'اللجان', icon: Users },
  { href: '/admin/dashboard?s=conferences', label: 'Conferences', ar: 'المؤتمرات', icon: Mic },
  { href: '/admin/dashboard?s=supervision', label: 'Supervision', ar: 'الإشراف', icon: UserCheck },
]

function isOn(path: string, s: string | null, href: string) {
  const [p, q] = href.split('?')
  if (p === '/admin/dashboard') {
    if (path !== '/admin/dashboard') return false
    const want = q ? new URLSearchParams(q).get('s') : null
    return (s || null) === want
  }
  return path === p || path.startsWith(p + '/')
}

/** Admin frame: the same navy top bar as the public site, with admin destinations. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = useCleanPath()
  const sp = useSearchParams()
  const s = sp.get('s')
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setOpen(false); setMenu(false) }, [path, s])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false) }
    document.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('mousedown', onDown) }
  }, [])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (path === '/admin/login') return <>{children}</>

  const signOut = () => signOutAll('/login')
  const contentOn = CONTENT.some((c) => isOn(path, s, c.href))
  const link = (on: boolean) => `relative flex items-center gap-1.5 px-3 py-5 text-[13.5px] transition-colors ${on ? 'font-semibold text-[#E3C566]' : 'text-[#C4CFDE] hover:text-white'}`

  return (
    <div dir="ltr" lang="en" className="admin min-h-screen bg-bg">
      <header className={`site-nav fixed inset-x-0 top-0 z-[100] h-16 ${scrolled ? 'border-b border-[#C9A227]/20 bg-deep shadow-[0_8px_30px_rgba(0,0,0,.35)]' : 'border-b border-white/[.06] bg-deep'}`}>
        <div className="mx-auto flex h-full max-w-[1680px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-12 2xl:px-[72px]">
          <Link href="/admin/dashboard" className="group flex min-w-0 items-center gap-3">
            <Logo className="h-10 w-10 shrink-0 transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-display text-[15.5px] font-semibold text-white">Admin <span className="font-arabic text-[13px] font-normal text-[#AEBBCC]">· لوحة التحكم</span></span>
              <span className="truncate text-[11.5px] text-[#C9A227]">Prof. Ahmad El-Ajou</span>
            </span>
          </Link>

          <nav className="hidden items-center lg:flex" aria-label="Admin">
            {MAIN.slice(0, 2).map((it) => {
              const on = isOn(path, s, it.href)
              return (
                <Link key={it.href} href={it.href} className={link(on)}>
                  {it.label}
                  <span className={`absolute inset-x-3 bottom-3 h-[2px] rounded bg-[#C9A227] transition-transform duration-300 ${on ? 'scale-x-100' : 'scale-x-0'}`} />
                </Link>
              )
            })}
            <div ref={menuRef} className="relative">
              <button type="button" onClick={() => setMenu(!menu)} className={link(contentOn)} aria-expanded={menu}>
                Website content <ChevronDown size={14} className={`transition-transform ${menu ? 'rotate-180' : ''}`} />
                <span className={`absolute inset-x-3 bottom-3 h-[2px] rounded bg-[#C9A227] transition-transform duration-300 ${contentOn ? 'scale-x-100' : 'scale-x-0'}`} />
              </button>
              <div className={`absolute start-0 top-full z-50 grid w-[460px] grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#0B1A2E] p-2 shadow-2xl transition duration-200 ${menu ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'}`}>
                {CONTENT.map((it) => {
                  const on = isOn(path, s, it.href)
                  const Icon = it.icon
                  return (
                    <Link key={it.href} href={it.href} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition ${on ? 'bg-[#C9A227]/[.14] text-[#F0D57E]' : 'text-[#C4CFDE] hover:bg-white/[.05] hover:text-white'}`}>
                      <Icon size={15} className={on ? 'text-[#E3C566]' : 'text-[#8394AC]'} />
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>
                      <span className="font-arabic text-[11px] text-[#7F90A8]">{it.ar}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
            {(() => {
              const it = MAIN[2]
              const on = isOn(path, s, it.href)
              return (
                <Link href={it.href} className={link(on)}>
                  {it.label}
                  <span className={`absolute inset-x-3 bottom-3 h-[2px] rounded bg-[#C9A227] transition-transform duration-300 ${on ? 'scale-x-100' : 'scale-x-0'}`} />
                </Link>
              )
            })()}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/dashboard" prefetch={false} title="See the site exactly as a student sees it" className="hidden items-center gap-1.5 rounded-md border border-white/25 px-3 py-2 text-[13px] text-white transition hover:border-[#C9A227] hover:text-[#E3C566] xl:inline-flex">
              <MonitorSmartphone size={15} /> Student view
            </Link>
            <Link href="/" className="hidden items-center gap-1.5 rounded-md bg-[#C9A227] px-3.5 py-2 text-[13px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A] sm:inline-flex">
              <Eye size={15} /> View site
            </Link>
            <ThemeToggle className="h-[38px] w-[38px] rounded-md border border-white/25 text-white transition hover:border-[#C9A227] hover:text-[#E3C566]" />
            <button onClick={signOut} title="Sign out" aria-label="Sign out" className="hidden h-[38px] w-[38px] items-center justify-center rounded-md border border-white/25 text-white transition hover:border-[#F08A7E] hover:text-[#F08A7E] sm:inline-flex">
              <LogOut size={17} />
            </button>
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-2 text-white lg:hidden">
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>
      <div className="nav-spacer h-16" aria-hidden />

      {/* phone / tablet drawer */}
      <div onClick={() => setOpen(false)} className={`fixed inset-0 z-[200] bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside className={`fixed inset-y-0 right-0 z-[201] flex w-[min(86vw,320px)] flex-col border-l border-[#C9A227]/20 bg-[#0B1A2E] shadow-2xl transition-transform duration-[380ms] ease-[cubic-bezier(.22,1,.36,1)] lg:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!open}>
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/[.07] px-5">
          <span className="font-display text-[15px] font-semibold text-white">Admin</span>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-lg border border-white/10 bg-white/5 p-2 text-white"><X size={20} /></button>
        </div>
        <nav className="no-scrollbar flex-1 overflow-y-auto py-2">
          {[...MAIN, ...CONTENT].map((it, i) => {
            const on = isOn(path, s, it.href)
            const Icon = it.icon
            return (
              <Link key={it.href} href={it.href} className={`flex items-center gap-3 border-s-[3px] px-5 py-2.5 text-[14.5px] ${i === MAIN.length ? 'mt-2 border-t border-t-white/[.07] pt-3.5' : ''} ${on ? 'border-s-[#C9A227] bg-[#C9A227]/[.08] font-semibold text-[#E3C566]' : 'border-s-transparent text-[#C4CFDE]'}`}>
                <Icon size={16} className="shrink-0 text-[#8394AC]" />
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
                <span className="font-arabic text-[12px] text-[#7F90A8]">{it.ar}</span>
              </Link>
            )
          })}
        </nav>
        <div className="space-y-2.5 border-t border-white/[.07] p-4">
          <Link href="/" className="flex items-center justify-center gap-2 rounded-lg bg-[#C9A227] py-3 text-[14.5px] font-semibold text-[#0A1A30]"><Eye size={17} /> View site · عرض الموقع</Link>
          <Link href="/dashboard" prefetch={false} className="flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 py-3 text-[14px] text-white"><MonitorSmartphone size={16} /> Student view · واجهة الطالب</Link>
          <button onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 py-3 text-[14px] text-white"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      <div className="mx-auto min-w-0 max-w-[1680px] lg:px-5">{children}</div>
    </div>
  )
}
