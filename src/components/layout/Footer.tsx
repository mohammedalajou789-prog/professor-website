'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { useCleanPath } from '@/lib/usePath'
import type { Brand } from './types'
import Logo from '@/components/ui/Logo'

export default function Footer({ brand }: { brand: Brand }) {
  const { isRTL } = useLang()
  const pathname = useCleanPath()
  if (pathname.startsWith('/admin') || pathname.startsWith('/print')) return null

  const name = isRTL ? brand.name_ar : brand.name_en
  const title = isRTL ? brand.title_ar : brand.title_en
  const nav = isRTL
    ? [['/about', 'السيرة'], ['/research', 'الأبحاث'], ['/publications', 'المنشورات'], ['/courses', 'المساقات'], ['/contact', 'تواصل']]
    : [['/about', 'About'], ['/research', 'Research'], ['/publications', 'Publications'], ['/courses', 'Courses'], ['/contact', 'Contact']]
  const social = [
    ['Google Scholar', 'GS', brand.google_scholar_url],
    ['ORCID', 'iD', brand.orcid_url],
    ['ResearchGate', 'RG', brand.researchgate_url],
    ['LinkedIn', 'in', brand.linkedin_url],
  ]
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-[#081527] text-muted">
      {/* sine wave signature */}
      <svg className="pointer-events-none absolute inset-x-0 top-0 h-16 w-full opacity-40" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden>
        <path d="M0 30 C 100 0, 200 60, 300 30 S 500 0, 600 30 S 800 60, 900 30 S 1100 0, 1200 30" fill="none" stroke="rgba(201,162,39,.35)" strokeWidth="1" />
        <path d="M0 36 C 100 10, 200 62, 300 36 S 500 10, 600 36 S 800 62, 900 36 S 1100 10, 1200 36" fill="none" stroke="rgba(174,196,224,.12)" strokeWidth="1" strokeDasharray="3 6" />
      </svg>

      <div className="relative mx-auto grid max-w-[1680px] gap-9 px-4 sm:px-7 lg:px-12 2xl:px-[72px] pb-8 pt-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <Logo className="h-11 w-11 shrink-0" />
            <div>
              <p className={`text-[17px] font-semibold text-white ${isRTL ? 'font-arabic' : 'font-display text-[19px]'}`}>{name}</p>
              <p className="text-[12.5px] text-[#C9A227]">{title}</p>
            </div>
          </div>
          <ul className="space-y-2.5 text-[13px]">
            <li className="flex items-start gap-2.5">
              <MapPin size={14} className="mt-0.5 shrink-0 text-[#C9A227]" />
              {isRTL ? 'جامعة البلقاء التطبيقية — قسم الرياضيات، السلط، الأردن' : 'Al-Balqa Applied University — Dept. of Mathematics, Al-Salt, Jordan'}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={14} className="shrink-0 text-[#C9A227]" />
              <a href={`mailto:${brand.email}`} dir="ltr" className="transition-colors hover:text-[#E3C566]">{brand.email}</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={14} className="shrink-0 text-[#C9A227]" />
              <a href={`tel:${brand.phone.replace(/\s/g, '')}`} dir="ltr" className="transition-colors hover:text-[#E3C566]">{brand.phone}</a>
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-4 h-[2px] w-9 bg-[#C9A227]" />
          <p className="mb-4 text-[11.5px] font-semibold uppercase tracking-[.12em] text-white">{isRTL ? 'روابط سريعة' : 'Quick links'}</p>
          <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-2.5">
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] transition-colors hover:text-[#E3C566] sm:border-0 sm:bg-transparent sm:p-0">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 h-[2px] w-9 bg-[#C9A227]" />
          <p className="mb-4 text-[11.5px] font-semibold uppercase tracking-[.12em] text-white">{isRTL ? 'الملفات الأكاديمية' : 'Academic profiles'}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2.5">
            {social.map(([label, mark, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2.5 text-[13px] transition-colors hover:text-[#E3C566]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/40 text-[9px] font-bold text-[#C9A227]">{mark}</span>
                <span className="truncate">{label}</span>
                <ArrowUpRight size={12} className="ms-auto hidden text-[#C9A227] opacity-50 transition group-hover:opacity-100 sm:block" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/[.07]">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-2 px-4 sm:px-7 lg:px-12 2xl:px-[72px] py-3.5 text-[11.5px] text-ink-2">
          <span>{isRTL ? `© ${year} أ.د. أحمد العجو. جميع الحقوق محفوظة.` : `© ${year} Prof. Ahmad El-Ajou. All rights reserved.`}</span>
          <span className="font-display italic" dir="ltr">e<sup>iπ</sup> + 1 = 0</span>
        </div>
      </div>
    </footer>
  )
}
