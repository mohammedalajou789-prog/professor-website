'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, User, FileText, BookOpen, Newspaper, GraduationCap, Briefcase, Award, Globe, Users, Mic, UserCheck,
  School, Sigma, ExternalLink, LogOut, Menu, X,
} from 'lucide-react'
import { useCleanPath } from '@/lib/usePath'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/ui/Logo'
import ThemeToggle from '@/components/ui/ThemeToggle'

type Item = { href: string; label: string; ar: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Teaching · التدريس',
    items: [
      { href: '/admin/courses', label: 'Courses & students', ar: 'المساقات والطلاب', icon: School },
      { href: '/admin/mn-guide', label: 'Sheet guide (MN)', ar: 'دليل الشيتات', icon: Sigma },
    ],
  },
  {
    title: 'Website · الموقع',
    items: [
      { href: '/admin/dashboard', label: 'Overview', ar: 'نظرة عامة', icon: LayoutDashboard },
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
    ],
  },
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

/** Admin frame: navy sidebar (drawer on phones) + calm content area. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = useCleanPath()
  const sp = useSearchParams()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [path, sp])

  if (path === '/admin/login') return <>{children}</>

  const signOut = async () => {
    await createClient().auth.signOut()
    router.push('/admin/login')
  }

  const nav = (
    <div className="flex h-full flex-col">
      <Link href="/admin/courses" className="flex items-center gap-3 border-b border-white/[.07] px-5 py-4">
        <Logo className="h-10 w-10" />
        <span className="leading-tight">
          <span className="block font-display text-[15.5px] font-semibold text-white">Admin</span>
          <span className="block text-[11.5px] text-[#C9A227]">Prof. Ahmad El-Ajou</span>
        </span>
      </Link>
      <nav className="no-scrollbar flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[.14em] text-[#7F90A8]">{g.title}</p>
            {g.items.map((it) => {
              const on = isOn(path, sp.get('s'), it.href)
              const Icon = it.icon
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition ${on ? 'bg-[#C9A227]/[.14] text-[#F0D57E]' : 'text-[#C4CFDE] hover:bg-white/[.05] hover:text-white'}`}
                >
                  <Icon size={16} className={on ? 'text-[#E3C566]' : 'text-[#8394AC] group-hover:text-[#C4CFDE]'} />
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  <span className="hidden truncate font-arabic text-[11.5px] text-[#7F90A8] 2xl:inline">{it.ar}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/[.07] p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[#C4CFDE] hover:bg-white/[.05] hover:text-white">
          <ExternalLink size={15} /> View website
        </Link>
        <ThemeToggle label={['Light mode', 'Dark mode']} className="w-full !justify-start rounded-lg px-3 py-2 text-[13px] text-[#C4CFDE] hover:bg-white/[.05] hover:text-white" />
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[#C4CFDE] hover:bg-white/[.05] hover:text-[#F08A7E]">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div dir="ltr" lang="en" className="admin min-h-screen bg-bg">
      <aside className="fixed inset-y-0 start-0 z-50 hidden w-[264px] bg-[#0A1B31] lg:block">{nav}</aside>

      {/* phone / tablet bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/[.07] bg-[#0A1B31] px-4 lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Menu" className="rounded-md p-1.5 text-white"><Menu size={22} /></button>
        <Logo className="h-8 w-8" />
        <span className="font-display text-[15px] font-semibold text-white">Admin</span>
      </div>
      <div onClick={() => setOpen(false)} className={`fixed inset-0 z-[60] bg-black/50 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
      <aside className={`fixed inset-y-0 start-0 z-[61] w-[min(86vw,300px)] bg-[#0A1B31] transition-transform duration-300 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setOpen(false)} aria-label="Close" className="absolute end-3 top-4 z-10 rounded-md p-1.5 text-white/70"><X size={20} /></button>
        {nav}
      </aside>

      <div className="min-w-0 lg:ps-[264px]">{children}</div>
    </div>
  )
}
