'use client'

import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
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
  const social = [
    ['Google Scholar', 'GS', brand.google_scholar_url],
    ['ORCID', 'iD', brand.orcid_url],
    ['ResearchGate', 'RG', brand.researchgate_url],
    ['LinkedIn', 'in', brand.linkedin_url],
  ]
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-[#C9A227]/15 bg-[#081527] text-[#9AABC2]">
      <div className="relative mx-auto flex max-w-[1680px] flex-col items-center gap-4 px-4 py-6 text-center sm:flex-row sm:justify-between sm:px-7 sm:text-start lg:px-12 2xl:px-[72px]">
        <Link href="/" className="group flex items-center gap-3">
          <Logo className="h-9 w-9 shrink-0 transition-transform duration-500 group-hover:rotate-[-4deg]" />
          <span className="leading-tight">
            <span className={`block font-semibold text-white ${isRTL ? 'font-arabic text-[14.5px]' : 'font-display text-[16px]'}`}>{name}</span>
            <span className="block text-[12px] text-[#C9A227]">{title}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {social.map(([label, mark, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A227]/35 text-[11px] font-bold text-[#C9A227] transition hover:-translate-y-0.5 hover:border-[#C9A227] hover:bg-[#C9A227] hover:text-[#081527]"
            >
              {mark}
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[.07]">
        <div className="mx-auto flex max-w-[1680px] flex-col items-center gap-1.5 px-4 py-3 text-[12px] sm:flex-row sm:justify-between sm:px-7 lg:px-12 2xl:px-[72px]">
          <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href={`mailto:${brand.email}`} dir="ltr" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#E3C566]"><Mail size={13} className="text-[#C9A227]" />{brand.email}</a>
            <a href={`tel:${brand.phone.replace(/\s/g, '')}`} dir="ltr" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#E3C566]"><Phone size={13} className="text-[#C9A227]" />{brand.phone}</a>
          </span>
          <span className="text-[#7F90A8]">{isRTL ? `© ${year} أ.د. أحمد العجو` : `© ${year} Prof. Ahmad El-Ajou`}</span>
        </div>
      </div>
    </footer>
  )
}
