'use client'

import { useEffect, useState, useRef, type ReactNode } from 'react'
import Image from 'next/image'
import MathField from '@/components/motion/MathField'
import { Download } from 'lucide-react'
import { useLang } from '@/context/LangContext'

interface Education {
  id: string
  degree_en: string
  degree_ar: string | null
  field_en: string | null
  field_ar: string | null
  institution_en: string
  institution_ar: string | null
  country: string | null
  year_start: number | null
  year_end: number | null
  thesis_title: string | null
  supervisor: string | null
}

interface Position {
  id: string
  title_en: string
  title_ar: string | null
  institution_en: string | null
  institution_ar: string | null
  department_en: string | null
  department_ar: string | null
  year_start: number | null
  year_end: number | null
  is_current: boolean
}

interface Award {
  id: string
  title_en: string
  title_ar: string | null
  organization_en: string | null
  organization_ar: string | null
  year: number | null
  description_en: string | null
  description_ar: string | null
}

interface Membership {
  id: string
  organization_en: string
  organization_ar: string | null
  role_en: string | null
  role_ar: string | null
  year_start: number | null
  year_end: number | null
  is_current: boolean
}

interface Committee {
  id: string
  name_en: string
  name_ar: string | null
  role_en: string | null
  role_ar: string | null
  institution_en: string | null
  institution_ar: string | null
  year_start: number | null
  year_end: number | null
  is_current: boolean
}

interface Conference {
  id: string
  name_en: string
  name_ar: string | null
  role: string
  paper_title: string | null
  location: string | null
  country: string | null
  year: number | null
}

interface Supervision {
  id: string
  student_name: string
  student_name_ar?: string | null
  institution_ar?: string | null
  thesis_title_en: string | null
  thesis_title_ar: string | null
  degree_level: string
  institution: string | null
  year_start: number | null
  year_end: number | null
  status: string
}

const sectionLabels = {
  en: {
    eyebrow: 'ACADEMIC PROFILE',
    cv: 'Download CV (PDF)',
    contents: 'ON THIS PAGE',
    bio: 'Biography',
    education: 'Education',
    positions: 'Academic Positions',
    awards: 'Awards & Honors',
    memberships: 'Memberships',
    committees: 'Committees',
    conferences: 'Conferences',
    supervision: 'Graduate Supervision',
    current: 'Current',
    active: 'Active',
    completed: 'Completed',
    ongoing: 'Ongoing',
    present: 'Present',
    noData: 'No data available yet.',
  },
  ar: {
    eyebrow: 'السيرة الأكاديمية',
    cv: 'تحميل السيرة الذاتية (PDF)',
    contents: 'محتويات الصفحة',
    bio: 'نبذة شخصية',
    education: 'التعليم',
    positions: 'المناصب الأكاديمية',
    awards: 'الجوائز والتكريم',
    memberships: 'العضويات',
    committees: 'اللجان',
    conferences: 'المؤتمرات',
    supervision: 'الإشراف على طلبة الدراسات العليا',
    current: 'حالي',
    active: 'حالي',
    completed: 'مكتمل',
    ongoing: 'جارٍ',
    present: 'حتى الآن',
    noData: 'لا توجد بيانات بعد.',
  },
}

const NAV_IDS = [
  'bio',
  'education',
  'positions',
  'awards',
  'memberships',
  'committees',
  'conferences',
  'supervision',
] as const

type SectionId = (typeof NAV_IDS)[number]

export type AboutData = {
  profile: any
  education: Education[]
  positions: Position[]
  awards: Award[]
  memberships: Membership[]
  committees: Committee[]
  conferences: Conference[]
  supervision: Supervision[]
}

export default function AboutView({ profile, education, positions, awards, memberships, committees, conferences, supervision }: AboutData) {
  const { lang, isRTL } = useLang()
  const loading = false
  const [activeSection, setActiveSection] = useState<SectionId>('bio')

  const isScrollingToRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // ref for mobile nav scroll
  const mobileNavRef = useRef<HTMLDivElement>(null)

  const t = isRTL ? sectionLabels.ar : sectionLabels.en

  useEffect(() => {
    if (loading) return

    const OFFSET = 140

    const handleScroll = () => {
      if (isScrollingToRef.current) return

      let current: SectionId = NAV_IDS[0]

      for (const id of NAV_IDS) {
        const element = document.getElementById(id)
        if (!element) continue
        if (element.getBoundingClientRect().top <= OFFSET) {
          current = id
        }
      }

      setActiveSection(current)

      // Auto-scroll mobile nav to keep active item visible
      if (mobileNavRef.current) {
        const activeBtn = mobileNavRef.current.querySelector(`[data-id="${current}"]`) as HTMLElement
        if (activeBtn) {
          const nav = mobileNavRef.current
          const btnLeft = activeBtn.offsetLeft
          const btnWidth = activeBtn.offsetWidth
          const navWidth = nav.offsetWidth
          nav.scrollTo({ left: btnLeft - navWidth / 2 + btnWidth / 2, behavior: 'smooth' })
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [loading])

  const handleNavClick = (id: SectionId) => {
    const section = document.getElementById(id)
    if (!section) return

    isScrollingToRef.current = true
    setActiveSection(id)

    const OFFSET = 100
    const top = section.getBoundingClientRect().top + window.scrollY - OFFSET

    window.scrollTo({ top, behavior: 'smooth' })

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingToRef.current = false
    }, 700)
  }

  const name = (isRTL ? profile?.name_ar || profile?.name_en : profile?.name_en) || (isRTL ? 'أ.د. أحمد العجو' : 'Prof. Ahmad El-Ajou')
  const title = (isRTL ? profile?.title_ar || profile?.title_en : profile?.title_en) || (isRTL ? 'أستاذ الرياضيات التطبيقية' : 'Full Professor of Mathematics')
  const bio = isRTL ? profile?.bio_ar || profile?.bio_en : profile?.bio_en
  const email = profile?.email || ''

  const yearRange = (
    start?: number | null,
    end?: number | null,
    current?: boolean
  ) => {
    if (!start && !end) return ''
    if (current) return `${start ?? ''} — ${t.present}`
    if (start && end) return `${start} — ${end}`
    return `${start ?? end ?? ''}`
  }

  const navigation: [SectionId, string, string][] = [
    ['bio', '01', t.bio],
    ['education', '02', t.education],
    ['positions', '03', t.positions],
    ['awards', '04', t.awards],
    ['memberships', '05', t.memberships],
    ['committees', '06', t.committees],
    ['conferences', '07', t.conferences],
    ['supervision', '08', t.supervision],
  ]

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`paper min-h-screen text-ink ${isRTL ? 'font-arabic' : ''}`}
    >

      {/* =========================================================
          HERO — unchanged on desktop | compact on mobile
      ========================================================= */}
      <section className="relative bg-deep pt-8 sm:pt-14 pb-8 sm:pb-14 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 130% at 78% 10%, #153A61 0%, #0E2846 40%, #0A1B31 74%, #061020 100%)',
            }}
          />

          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, rgba(255,255,255,.6) 0, rgba(255,255,255,.6) 1px, transparent 1px, transparent 72px), repeating-linear-gradient(rgba(255,255,255,.6) 0, rgba(255,255,255,.6) 1px, transparent 1px, transparent 72px)',
            }}
          />

          {/* Hide decorative SVG on mobile to save space */}
          <div className="hidden sm:block absolute top-0 bottom-0 right-0 w-[62%] max-w-[720px]">
            <svg
              viewBox="0 0 720 320"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full opacity-50"
            >
              <g fill="none" stroke="rgba(201,162,39,.22)" strokeWidth="1.2">
                <path d="M40 250 C 140 250 150 90 240 90 C 330 90 340 210 430 210 C 520 210 540 130 680 150" />
                <path
                  d="M40 268 C 150 268 170 160 260 160 C 350 160 380 236 470 236 C 560 236 590 196 680 204"
                  stroke="rgba(174,196,224,.18)"
                  strokeDasharray="4 5"
                />
              </g>
              <g stroke="rgba(174,196,224,.16)" strokeWidth="1">
                <path d="M40 40 L40 286 L690 286" fill="none" />
                <path d="M240 90 L240 286 M430 210 L430 286" strokeDasharray="3 6" />
              </g>
              <g fill="rgba(201,162,39,.28)">
                <circle cx="240" cy="90" r="3.2" />
                <circle cx="430" cy="210" r="3.2" />
              </g>
            </svg>

            <div
              dir="ltr"
              className="absolute inset-0 font-serif italic text-[rgba(206,222,240,.13)] leading-relaxed whitespace-nowrap pointer-events-none"
            >
              <span className="absolute top-[6%] left-[4%] text-[clamp(13px,1.35vw,19px)]">
                <sup>c</sup>D<sub>t</sub>
                <sup>α</sup> u(t) = 1⁄Γ(1−α) ∫<sub>0</sub>
                <sup>t</sup> u′(τ)(t−τ)<sup>−α</sup> dτ
              </span>
              <span className="absolute top-[30%] left-[12%] text-[clamp(12px,1.2vw,17px)]">
                E<sub>α,β</sub>(z) = ∑<sub>k=0</sub>
                <sup>∞</sup> z<sup>k</sup> ⁄ Γ(αk + β)
              </span>
              <span className="absolute top-[52%] left-[2%] text-[clamp(12px,1.2vw,17px)]">
                ℒ&#123;D<sup>α</sup>u&#125; = s<sup>α</sup>U(s) − ∑
                <sub>k=0</sub>
                <sup>m−1</sup> s<sup>α−k−1</sup>u<sup>(k)</sup>(0)
              </span>
              <span className="absolute top-[74%] left-[16%] text-[clamp(12px,1.2vw,17px)]">
                u(x,t) = ∑<sub>n=0</sub>
                <sup>∞</sup> f<sub>n</sub>(x) t<sup>nα</sup> ⁄ Γ(nα+1)
              </span>
              <span className="absolute bottom-[4%] left-[6%] text-[clamp(11px,1.05vw,15px)] text-[rgba(201,162,39,.16)]">
                I<sup>α</sup>f(x) = 1⁄Γ(α) ∫<sub>a</sub>
                <sup>x</sup> (x−t)<sup>α−1</sup> f(t) dt
              </span>
            </div>
          </div>
        </div>

        <MathField variant="waves" className="absolute inset-0 h-full w-full opacity-60" density={0.7} />
        <div className="relative max-w-[1680px] mx-auto flex items-center gap-5 sm:gap-8 px-4 sm:px-7 lg:px-12 2xl:px-[72px]">
          <div className="page-enter relative shrink-0 h-[84px] w-[84px] sm:h-[132px] sm:w-[132px]">
            <span className="absolute -inset-[6px] rounded-full border border-[#C9A227]/40" />
            <span className="absolute -inset-[12px] rounded-full border border-dashed border-white/10 animate-[spin-slow_40s_linear_infinite]" />
            <span className="absolute inset-0 overflow-hidden rounded-full border-2 border-[#C9A227]/80 bg-[#0E2846]">
              <Image src="/images/prof-portrait.jpg" alt={name || ''} fill priority sizes="132px" className="object-cover object-[50%_15%]" />
            </span>
          </div>
          <div className="min-w-0">
          <p className="mb-2 sm:mb-3 text-[11px] sm:text-[12px] font-semibold text-[#C9A227] tracking-[0.08em]">
            {t.eyebrow}
          </p>

          <h1 className="mb-2 sm:mb-3 max-w-3xl text-white font-serif text-[clamp(24px,4vw,44px)] leading-[1.2] sm:leading-[1.14] font-semibold tracking-[-0.012em]">
            {name}
          </h1>

          <p className="mb-4 sm:mb-6 max-w-3xl text-[14px] sm:text-[15.5px] leading-[1.6] text-[#AEBBCC]">
            {title}
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {profile?.cv_url && (
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[3px] bg-[#C9A227] px-4 sm:px-5 py-2.5 sm:py-3 text-[13px] sm:text-[13.5px] font-semibold text-[#0A1B31] transition-colors hover:bg-[#E0C45B]"
              >
                <Download size={14} />
                {t.cv}
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center rounded-[3px] border border-white/25 px-3 sm:px-[18px] py-2.5 sm:py-3 text-[12px] sm:text-[13.5px] text-[#DCE6F2] transition-colors hover:border-white/40 hover:text-white truncate max-w-[200px] sm:max-w-none"
                dir="ltr"
              >
                {email}
              </a>
            )}
          </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          MOBILE NAV — horizontal scrollable tabs (hidden on lg+)
      ========================================================= */}
      <div className="lg:hidden sticky top-[64px] z-30 bg-surface border-b border-line shadow-sm">
        <div
          ref={mobileNavRef}
          className="flex overflow-x-auto scrollbar-hide px-4 gap-1 py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {navigation.map(([id, number, label]) => {
            const active = activeSection === id
            return (
              <button
                key={id}
                data-id={id}
                onClick={() => handleNavClick(id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-navy text-white'
                    : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
                }`}
              >
                <span className="font-serif italic text-[11px] text-[#C9A227]">{number}</span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-7 lg:px-12 2xl:px-[72px] py-6 sm:py-10 flex gap-8 xl:gap-10 items-start">

        {/* =======================================================
            LEFT NAVIGATION RAIL — desktop only (unchanged)
        ======================================================= */}
        <aside className="card hidden lg:block flex-[0_0_220px] sticky top-[96px] self-start p-5">
          <p className="mb-[18px] text-[11.5px] font-semibold text-muted">
            {t.contents}
          </p>

          <nav className="flex flex-col gap-0.5">
            {navigation.map(([id, number, label]) => {
              const active = activeSection === id

              return (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNavClick(id)
                  }}
                  className={`flex items-baseline gap-[11px] py-2 text-[14px] leading-[1.4] transition-all ${
                    active
                      ? 'text-ink border-s-[#C9A227]'
                      : 'text-muted border-s-line'
                  } border-s-2 ps-[14px] hover:text-ink`}
                >
                  <span
                    dir="ltr"
                    className="font-serif italic text-[12.5px] text-[#C9A227]"
                  >
                    {number}
                  </span>
                  <span>{label}</span>
                </a>
              )
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 flex flex-col gap-5 sm:gap-7 pb-20">

          {/* BIOGRAPHY */}
          <Section id="bio" number="01" title={t.bio} isRTL={isRTL}>
            {bio ? (
              <p className="m-0 text-[15px] sm:text-[16px] leading-[1.8] text-ink-2">{bio}</p>
            ) : (
              <Empty isRTL={isRTL} text={t.noData} />
            )}
          </Section>

          {/* EDUCATION */}
          <Section id="education" number="02" title={t.education} isRTL={isRTL}>
            {education.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {education.map((ed, index) => (
                  <div key={ed.id} className="flex gap-3 sm:gap-6 pb-8">
                    {/* Year — hidden on mobile, shown inline in content */}
                    <div className="hidden sm:block flex-[0_0_92px] text-end pt-[3px]">
                      <bdi dir="ltr" className="font-serif text-[15px] font-semibold text-ink">
                        {yearRange(ed.year_start, ed.year_end)}
                      </bdi>
                    </div>

                    <div className="hidden sm:block flex-[0_0_auto] w-px bg-surface-3 relative">
                      <span
                        className={`absolute top-[6px] -start-1 w-[9px] h-[9px] rounded-full border-2 border-[#C9A227] ${
                          index === 0 ? 'bg-[#C9A227]' : 'bg-surface'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 pb-1">
                      {/* Year shown on mobile above the title */}
                      {(ed.year_start || ed.year_end) && (
                        <bdi dir="ltr" className="sm:hidden block mb-1 font-serif text-[13px] font-semibold text-[#C9A227]">
                          {yearRange(ed.year_start, ed.year_end)}
                        </bdi>
                      )}

                      <h3 className="m-0 mb-[5px] font-serif text-[17px] sm:text-[19px] font-semibold leading-[1.4] text-ink">
                        {isRTL ? ed.degree_ar || ed.degree_en : ed.degree_en}
                      </h3>

                      {(ed.field_en || ed.field_ar) && (
                        <p className="m-0 mb-[3px] text-[14px] sm:text-[14.5px] text-[#C9A227]">
                          {isRTL ? ed.field_ar || ed.field_en : ed.field_en}
                        </p>
                      )}

                      <p className="m-0 mb-3 text-[13.5px] sm:text-[14.5px] text-ink-2">
                        {isRTL ? ed.institution_ar || ed.institution_en : ed.institution_en}
                        {ed.country && ` · ${ed.country}`}
                      </p>

                      {ed.thesis_title && (
                        <div className="border-s-2 border-line ps-[14px] mb-2">
                          <p className="m-0 font-serif italic text-[13.5px] sm:text-[14.5px] leading-[1.7] text-ink-2">
                            {ed.thesis_title}
                          </p>
                        </div>
                      )}

                      {ed.supervisor && (
                        <p className="m-0 text-[12.5px] sm:text-[13px] leading-[1.6] text-muted">
                          {isRTL ? 'المشرف: ' : 'Supervisor: '}
                          {ed.supervisor}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* POSITIONS */}
          <Section id="positions" number="03" title={t.positions} isRTL={isRTL}>
            {positions.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {positions.map((pos) => (
                  <div key={pos.id} className="flex gap-3 sm:gap-6 pb-[26px]">
                    <div className="hidden sm:block flex-[0_0_92px] text-end pt-[3px]">
                      <bdi dir="ltr" className="font-serif text-[15px] font-semibold text-ink">
                        {yearRange(pos.year_start, pos.year_end, pos.is_current)}
                      </bdi>
                    </div>

                    <div className="hidden sm:block flex-[0_0_auto] w-px bg-surface-3 relative">
                      <span
                        className={`absolute top-[6px] -start-1 w-[9px] h-[9px] rounded-full border-2 ${
                          pos.is_current
                            ? 'bg-[#C9A227] border-[#C9A227]'
                            : 'bg-surface border-line-2'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Year + current badge on mobile */}
                      <div className="sm:hidden flex items-center gap-2 mb-1 flex-wrap">
                        <bdi dir="ltr" className="font-serif text-[13px] font-semibold text-[#C9A227]">
                          {yearRange(pos.year_start, pos.year_end, pos.is_current)}
                        </bdi>
                        {pos.is_current && (
                          <span className="text-[11px] font-semibold text-gold-ink bg-[rgba(201,162,39,.14)] px-[8px] py-[2px] rounded-[2px]">
                            {t.current}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mb-[5px]">
                        <h3 className="m-0 font-serif text-[17px] sm:text-[19px] font-semibold leading-[1.4] text-ink">
                          {isRTL ? pos.title_ar || pos.title_en : pos.title_en}
                        </h3>

                        {pos.is_current && (
                          <span className="hidden sm:inline text-[11.5px] font-semibold text-gold-ink bg-[rgba(201,162,39,.14)] px-[9px] py-[3px] rounded-[2px]">
                            {t.current}
                          </span>
                        )}
                      </div>

                      {(pos.institution_en || pos.institution_ar) && (
                        <p className="m-0 text-[13.5px] sm:text-[14.5px] leading-[1.6] text-ink-2">
                          {isRTL ? pos.institution_ar || pos.institution_en : pos.institution_en}
                        </p>
                      )}

                      {(pos.department_en || pos.department_ar) && (
                        <p className="m-0 mt-[2px] text-[13px] sm:text-[13.5px] text-muted">
                          {isRTL ? pos.department_ar || pos.department_en : pos.department_en}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* AWARDS */}
          <Section id="awards" number="04" title={t.awards} isRTL={isRTL}>
            {awards.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {awards.map((award) => (
                  <div
                    key={award.id}
                    className="bg-surface border border-line border-t-2 border-t-[#C9A227] px-4 sm:px-[22px] py-4 sm:py-[22px]"
                  >
                    {award.year && (
                      <bdi dir="ltr" className="block mb-[9px] font-serif text-[13px] font-semibold text-[#C9A227]">
                        {award.year}
                      </bdi>
                    )}

                    <h3 className="m-0 mb-[6px] font-serif text-[16px] sm:text-[17px] font-semibold leading-[1.45] text-ink">
                      {isRTL ? award.title_ar || award.title_en : award.title_en}
                    </h3>

                    {(award.organization_en || award.organization_ar) && (
                      <p className="m-0 mb-[10px] text-[13px] sm:text-[13.5px] text-ink-2">
                        {isRTL ? award.organization_ar || award.organization_en : award.organization_en}
                      </p>
                    )}

                    {(award.description_en || award.description_ar) && (
                      <p className="m-0 text-[13px] leading-[1.75] text-muted">
                        {isRTL ? award.description_ar || award.description_en : award.description_en}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* MEMBERSHIPS */}
          <Section id="memberships" number="05" title={t.memberships} isRTL={isRTL}>
            {memberships.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center gap-3 sm:gap-[18px] py-[14px] sm:py-[17px] border-b border-line"
                  >
                    <bdi dir="ltr" className="flex-[0_0_44px] sm:flex-[0_0_52px] font-serif text-[13px] font-semibold text-[#C9A227]">
                      {membership.year_start ?? ''}
                    </bdi>

                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-[14px] sm:text-[15px] font-medium leading-[1.5] text-ink">
                        {isRTL
                          ? membership.organization_ar || membership.organization_en
                          : membership.organization_en}
                      </p>

                      {(membership.role_en || membership.role_ar) && (
                        <p className="m-0 mt-[2px] text-[12.5px] sm:text-[13px] text-muted">
                          {isRTL ? membership.role_ar || membership.role_en : membership.role_en}
                        </p>
                      )}
                    </div>

                    {membership.is_current && (
                      <span className="flex-[0_0_auto] text-[11px] sm:text-[11.5px] font-semibold text-gold-ink bg-[rgba(201,162,39,.14)] px-[8px] py-[3px] rounded-[2px]">
                        {t.active}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* COMMITTEES */}
          <Section id="committees" number="06" title={t.committees} isRTL={isRTL}>
            {committees.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {committees.map((committee) => (
                  <div
                    key={committee.id}
                    className="bg-surface border border-line px-4 sm:px-[22px] py-4 sm:py-5"
                  >
                    {(committee.role_en || committee.role_ar) && (
                      <p className="m-0 mb-[6px] text-[12px] sm:text-[12.5px] font-semibold text-[#C9A227]">
                        {isRTL ? committee.role_ar || committee.role_en : committee.role_en}
                      </p>
                    )}

                    <h3 className="m-0 mb-[6px] font-serif text-[15.5px] sm:text-[16.5px] font-semibold leading-[1.45] text-ink">
                      {isRTL ? committee.name_ar || committee.name_en : committee.name_en}
                    </h3>

                    {(committee.institution_en || committee.institution_ar) && (
                      <p className="m-0 mb-[10px] text-[13px] sm:text-[13.5px] text-ink-2">
                        {isRTL
                          ? committee.institution_ar || committee.institution_en
                          : committee.institution_en}
                      </p>
                    )}

                    {(committee.year_start || committee.year_end) && (
                      <bdi dir="ltr" className="block text-[12px] sm:text-[12.5px] text-muted">
                        {yearRange(committee.year_start, committee.year_end, committee.is_current)}
                      </bdi>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* CONFERENCES */}
          <Section id="conferences" number="07" title={t.conferences} isRTL={isRTL}>
            {conferences.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {conferences.map((conference) => (
                  <div key={conference.id} className="flex gap-3 sm:gap-[22px] py-4 sm:py-5 border-b border-line">
                    <bdi dir="ltr" className="flex-[0_0_48px] sm:flex-[0_0_64px] font-serif text-[18px] sm:text-[22px] font-semibold leading-[1.2] text-ink">
                      {conference.year ?? ''}
                    </bdi>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[8px] sm:gap-[10px] flex-wrap mb-1">
                        <span className="text-[11px] sm:text-[11.5px] font-semibold text-ink-2 bg-surface-2 px-[8px] sm:px-[9px] py-[3px] rounded-[2px]">
                          {conference.role}
                        </span>

                        {conference.location && (
                          <span className="text-[12px] sm:text-[12.5px] text-muted">
                            {conference.location}
                            {conference.country && `, ${conference.country}`}
                          </span>
                        )}
                      </div>

                      <p className="m-0 mb-1 font-medium text-[14px] sm:text-[15px] leading-[1.55] text-ink">
                        {isRTL ? conference.name_ar || conference.name_en : conference.name_en}
                      </p>

                      {conference.paper_title && (
                        <p className="m-0 font-serif italic text-[13px] sm:text-[14px] leading-[1.7] text-ink-2">
                          {conference.paper_title}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* SUPERVISION */}
          <Section id="supervision" number="08" title={t.supervision} isRTL={isRTL}>
            {supervision.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {supervision.map((student) => (
                  <div
                    key={student.id}
                    className="flex gap-3 sm:gap-5 items-start py-[16px] sm:py-[19px] border-b border-line"
                  >
                    <span className="flex-[0_0_auto] min-w-[40px] sm:min-w-[46px] text-center text-[11px] sm:text-[11.5px] font-semibold text-ink bg-surface-2 px-[7px] sm:px-[9px] py-1 rounded-[2px]">
                      {isRTL ? ({ phd: 'دكتوراه', masters: 'ماجستير', postdoc: 'ما بعد الدكتوراه' } as Record<string, string>)[student.degree_level] || student.degree_level : ({ phd: 'PhD', masters: 'MSc', postdoc: 'Postdoc' } as Record<string, string>)[student.degree_level] || student.degree_level}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="m-0 mb-[3px] text-[14px] sm:text-[15px] font-medium leading-[1.5] text-ink">
                        {isRTL ? student.student_name_ar || student.student_name : student.student_name}
                      </p>

                      {(student.thesis_title_en || student.thesis_title_ar) && (
                        <p className="m-0 mb-[6px] font-serif italic text-[13px] sm:text-[14px] leading-[1.7] text-ink-2">
                          {isRTL
                            ? student.thesis_title_ar || student.thesis_title_en
                            : student.thesis_title_en}
                        </p>
                      )}

                      <bdi dir={isRTL && student.institution_ar ? 'rtl' : 'ltr'} className="block text-[12px] sm:text-[12.5px] text-muted">
                        {(isRTL ? student.institution_ar || student.institution : student.institution) || ''}
                        {student.institution && (student.year_start || student.year_end) && ' · '}
                        {yearRange(student.year_start, student.year_end)}
                      </bdi>
                    </div>

                    <span
                      className={`flex-[0_0_auto] text-[11px] sm:text-[11.5px] font-semibold px-[8px] sm:px-[9px] py-[3px] rounded-[2px] ${
                        student.status === 'completed'
                          ? 'text-[#2F6B4A] bg-[rgba(47,107,74,.10)]'
                          : 'text-gold-ink bg-[rgba(201,162,39,.14)]'
                      }`}
                    >
                      {student.status === 'completed' ? t.completed : t.ongoing}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

        </main>
      </div>
    </div>
  )
}

/* =============================================================
   SECTION HEADER — unchanged
============================================================= */
function Section({
  id,
  number,
  title,
  isRTL,
  children,
}: {
  id: string
  number: string
  title: string
  isRTL: boolean
  children: ReactNode
}) {
  return (
    <section id={id} className="card reveal scroll-mt-[110px] p-5 sm:p-8 lg:scroll-mt-[100px]">
      <div className="flex items-baseline gap-[14px] mb-2">
        <span dir="ltr" className="font-serif italic text-[15px] text-[#C9A227]">
          {number}
        </span>

        <h2 className="m-0 font-serif text-[clamp(22px,3.2vw,30px)] font-semibold leading-[1.25] text-ink">
          {title}
        </h2>
      </div>

      <div
        className="h-px mb-[20px] sm:mb-[26px]"
        style={{
          background: isRTL
            ? 'linear-gradient(to left, #C9A227 0px, #C9A227 56px, var(--c-line) 56px, var(--c-line) 100%)'
            : 'linear-gradient(to right, #C9A227 0px, #C9A227 56px, var(--c-line) 56px, var(--c-line) 100%)',
        }}
      />

      {children}
    </section>
  )
}

/* =============================================================
   EMPTY STATE — unchanged
============================================================= */
function Empty({ isRTL, text }: { isRTL: boolean; text: string }) {
  return (
    <p className={`m-0 py-4 text-[14px] text-muted ${isRTL ? 'text-right' : 'text-left'}`}>
      {text}
    </p>
  )
}