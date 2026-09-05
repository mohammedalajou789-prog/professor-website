'use client'

import { useEffect, useState, useRef, type ReactNode } from 'react'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
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

export default function AboutPage() {
  const { lang, isRTL } = useLang()

  const [profile, setProfile] = useState<any>(null)
  const [education, setEducation] = useState<Education[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [awards, setAwards] = useState<Award[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [committees, setCommittees] = useState<Committee[]>([])
  const [conferences, setConferences] = useState<Conference[]>([])
  const [supervision, setSupervision] = useState<Supervision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('bio')

  // FIX: ref to track if scroll was triggered by nav click (to prevent listener override)
  const isScrollingToRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const t = isRTL ? sectionLabels.ar : sectionLabels.en

  // FIX: Promise.allSettled + proper error handling
  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient()

        const results = await Promise.allSettled([
          supabase.from('profile').select('*').single(),
          supabase.from('education').select('*').order('sort_order'),
          supabase.from('positions').select('*').order('sort_order'),
          supabase.from('awards').select('*').order('sort_order'),
          supabase.from('memberships').select('*').order('sort_order'),
          supabase.from('committees').select('*').order('sort_order'),
          supabase.from('conferences').select('*').order('year', { ascending: false }),
          supabase.from('supervision').select('*').order('sort_order'),
        ])

        const [
          profileResult,
          educationResult,
          positionsResult,
          awardsResult,
          membershipsResult,
          committeesResult,
          conferencesResult,
          supervisionResult,
        ] = results

        if (profileResult.status === 'fulfilled' && profileResult.value.data)
          setProfile(profileResult.value.data)

        if (educationResult.status === 'fulfilled' && educationResult.value.data)
          setEducation(educationResult.value.data)

        if (positionsResult.status === 'fulfilled' && positionsResult.value.data)
          setPositions(positionsResult.value.data)

        if (awardsResult.status === 'fulfilled' && awardsResult.value.data)
          setAwards(awardsResult.value.data)

        if (membershipsResult.status === 'fulfilled' && membershipsResult.value.data)
          setMemberships(membershipsResult.value.data)

        if (committeesResult.status === 'fulfilled' && committeesResult.value.data)
          setCommittees(committeesResult.value.data)

        if (conferencesResult.status === 'fulfilled' && conferencesResult.value.data)
          setConferences(conferencesResult.value.data)

        if (supervisionResult.status === 'fulfilled' && supervisionResult.value.data)
          setSupervision(supervisionResult.value.data)
      } catch (err) {
        setError('Failed to load data. Please refresh the page.')
        console.error('Fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Scroll detection on window — no nested scrollbar
  useEffect(() => {
    if (loading) return

    const OFFSET = 140 // navbar height + some breathing room

    const handleScroll = () => {
      if (isScrollingToRef.current) return

      let current: SectionId = NAV_IDS[0]

      for (const id of NAV_IDS) {
        const element = document.getElementById(id)
        if (!element) continue

        // position relative to viewport top
        if (element.getBoundingClientRect().top <= OFFSET) {
          current = id
        }
      }

      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [loading])

  // Nav click scrolls the window, not a nested container
  const handleNavClick = (id: SectionId) => {
    const section = document.getElementById(id)
    if (!section) return

    isScrollingToRef.current = true
    setActiveSection(id)

    const OFFSET = 100 // leave gap below sticky navbar
    const top = section.getBoundingClientRect().top + window.scrollY - OFFSET

    window.scrollTo({ top, behavior: 'smooth' })

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingToRef.current = false
    }, 700)
  }

  const name = isRTL ? profile?.name_ar || profile?.name_en : profile?.name_en
  const title = isRTL ? profile?.title_ar || profile?.title_en : profile?.title_en
  const bio = isRTL ? profile?.bio_ar || profile?.bio_en : profile?.bio_en

  // FIX: use profile?.email from DB, not hardcoded string
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <div className="w-10 h-10 rounded-full border-4 border-[#12233C] border-t-[#C9A227] animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <p className="text-[#52627A] text-[15px]">{error}</p>
      </div>
    )
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
      className={`min-h-screen bg-[#F6F8FC] text-[#16233A] ${
        isRTL ? 'font-arabic' : ''
      }`}
    >
      <Navbar />

      {/* =========================================================
          HERO — mt-[68px] يعوّض ارتفاع الـ Navbar الـ fixed
      ========================================================= */}
      <section className="relative bg-[#0A1B31] px-6 pt-[84px] pb-14 overflow-hidden">
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

          <div className="absolute top-0 bottom-0 right-0 w-[62%] max-w-[720px]">
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

        <div className="relative max-w-[1220px] mx-auto">
          <p className="mb-3 text-[12px] font-semibold text-[#C9A227] tracking-[0.08em]">
            {t.eyebrow}
          </p>

          <h1 className="mb-3 max-w-3xl text-white font-serif text-[clamp(30px,4vw,44px)] leading-[1.14] font-semibold tracking-[-0.012em]">
            {name}
          </h1>

          <p className="mb-6 max-w-3xl text-[15.5px] leading-[1.6] text-[#AEBBCC]">
            {title}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {profile?.cv_url && (
              <a
                href={profile.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[3px] bg-[#C9A227] px-5 py-3 text-[13.5px] font-semibold text-[#0A1B31] transition-colors hover:bg-[#E0C45B]"
              >
                <Download size={15} />
                {t.cv}
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center rounded-[3px] border border-white/25 px-[18px] py-3 text-[13.5px] text-[#DCE6F2] transition-colors hover:border-white/40 hover:text-white"
                dir="ltr"
              >
                {email}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          MAIN CONTENT
          FIX: Removed h-[calc(100vh-90px)] and overflow-hidden from wrapper
               so content isn't clipped. Scroll is now on the main element only.
      ========================================================= */}
      <div className="max-w-[1220px] mx-auto px-6 py-10 flex gap-14 items-start">

        {/* =======================================================
            LEFT NAVIGATION RAIL
            FIX: sticky positioning so sidebar stays visible while scrolling
        ======================================================= */}
        <aside className="hidden lg:block flex-[0_0_196px] sticky top-[calc(50vh-200px)] self-start pt-2">
          <p className="mb-[18px] text-[11.5px] font-semibold text-[#8C9BB2]">
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
                      ? 'text-[#12233C] border-s-[#C9A227]'
                      : 'text-[#8C9BB2] border-s-[#E2E8F1]'
                  } border-s-2 ps-[14px] hover:text-[#12233C]`}
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

        {/* Content — no overflow here; window handles all scrolling */}
        <main className="flex-1 min-w-0 max-w-[820px] flex flex-col gap-[54px] pb-20">
          {/* =====================================================
              BIOGRAPHY
          ===================================================== */}
          <Section id="bio" number="01" title={t.bio} isRTL={isRTL}>
            {bio ? (
              <p className="m-0 text-[16px] leading-[1.8] text-[#3D4C63]">{bio}</p>
            ) : (
              <Empty isRTL={isRTL} text={t.noData} />
            )}
          </Section>

          {/* =====================================================
              EDUCATION
          ===================================================== */}
          <Section id="education" number="02" title={t.education} isRTL={isRTL}>
            {education.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {education.map((ed, index) => (
                  <div key={ed.id} className="flex gap-6 pb-8">
                    <div className="flex-[0_0_92px] text-end pt-[3px]">
                      <bdi dir="ltr" className="font-serif text-[15px] font-semibold text-[#12233C]">
                        {yearRange(ed.year_start, ed.year_end)}
                      </bdi>
                    </div>

                    <div className="flex-[0_0_auto] w-px bg-[#E2E8F1] relative">
                      {/* FIX: first item gets filled dot, rest get hollow */}
                      <span
                        className={`absolute top-[6px] -start-1 w-[9px] h-[9px] rounded-full border-2 border-[#C9A227] ${
                          index === 0 ? 'bg-[#C9A227]' : 'bg-white'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0 pb-1">
                      <h3 className="m-0 mb-[5px] font-serif text-[19px] font-semibold leading-[1.4] text-[#12233C]">
                        {isRTL ? ed.degree_ar || ed.degree_en : ed.degree_en}
                      </h3>

                      {(ed.field_en || ed.field_ar) && (
                        <p className="m-0 mb-[3px] text-[14.5px] text-[#C9A227]">
                          {isRTL ? ed.field_ar || ed.field_en : ed.field_en}
                        </p>
                      )}

                      <p className="m-0 mb-3 text-[14.5px] text-[#52627A]">
                        {isRTL ? ed.institution_ar || ed.institution_en : ed.institution_en}
                        {ed.country && ` · ${ed.country}`}
                      </p>

                      {ed.thesis_title && (
                        <div className="border-s-2 border-[#EDF1F7] ps-[14px] mb-2">
                          <p className="m-0 font-serif italic text-[14.5px] leading-[1.7] text-[#3D4C63]">
                            {ed.thesis_title}
                          </p>
                        </div>
                      )}

                      {ed.supervisor && (
                        <p className="m-0 text-[13px] leading-[1.6] text-[#8C9BB2]">
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

          {/* =====================================================
              POSITIONS
          ===================================================== */}
          <Section id="positions" number="03" title={t.positions} isRTL={isRTL}>
            {positions.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {positions.map((pos) => (
                  <div key={pos.id} className="flex gap-6 pb-[26px]">
                    <div className="flex-[0_0_92px] text-end pt-[3px]">
                      <bdi dir="ltr" className="font-serif text-[15px] font-semibold text-[#12233C]">
                        {yearRange(pos.year_start, pos.year_end, pos.is_current)}
                      </bdi>
                    </div>

                    <div className="flex-[0_0_auto] w-px bg-[#E2E8F1] relative">
                      <span
                        className={`absolute top-[6px] -start-1 w-[9px] h-[9px] rounded-full border-2 ${
                          pos.is_current
                            ? 'bg-[#C9A227] border-[#C9A227]'
                            : 'bg-white border-[#C8D3E2]'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-[5px]">
                        <h3 className="m-0 font-serif text-[19px] font-semibold leading-[1.4] text-[#12233C]">
                          {isRTL ? pos.title_ar || pos.title_en : pos.title_en}
                        </h3>

                        {pos.is_current && (
                          <span className="text-[11.5px] font-semibold text-[#9C7C15] bg-[rgba(201,162,39,.14)] px-[9px] py-[3px] rounded-[2px]">
                            {t.current}
                          </span>
                        )}
                      </div>

                      {(pos.institution_en || pos.institution_ar) && (
                        <p className="m-0 text-[14.5px] leading-[1.6] text-[#52627A]">
                          {isRTL ? pos.institution_ar || pos.institution_en : pos.institution_en}
                        </p>
                      )}

                      {(pos.department_en || pos.department_ar) && (
                        <p className="m-0 mt-[2px] text-[13.5px] text-[#8C9BB2]">
                          {isRTL ? pos.department_ar || pos.department_en : pos.department_en}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* =====================================================
              AWARDS
          ===================================================== */}
          <Section id="awards" number="04" title={t.awards} isRTL={isRTL}>
            {awards.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {awards.map((award) => (
                  <div
                    key={award.id}
                    className="bg-white border border-[#E4EAF3] border-t-2 border-t-[#C9A227] px-[22px] py-[22px]"
                  >
                    {award.year && (
                      <bdi dir="ltr" className="block mb-[9px] font-serif text-[13px] font-semibold text-[#C9A227]">
                        {award.year}
                      </bdi>
                    )}

                    <h3 className="m-0 mb-[6px] font-serif text-[17px] font-semibold leading-[1.45] text-[#12233C]">
                      {isRTL ? award.title_ar || award.title_en : award.title_en}
                    </h3>

                    {(award.organization_en || award.organization_ar) && (
                      <p className="m-0 mb-[10px] text-[13.5px] text-[#52627A]">
                        {isRTL ? award.organization_ar || award.organization_en : award.organization_en}
                      </p>
                    )}

                    {(award.description_en || award.description_ar) && (
                      <p className="m-0 text-[13px] leading-[1.75] text-[#8C9BB2]">
                        {isRTL ? award.description_ar || award.description_en : award.description_en}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* =====================================================
              MEMBERSHIPS
          ===================================================== */}
          <Section id="memberships" number="05" title={t.memberships} isRTL={isRTL}>
            {memberships.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex items-center gap-[18px] py-[17px] border-b border-[#E7ECF4]"
                  >
                    <bdi dir="ltr" className="flex-[0_0_52px] font-serif text-[13px] font-semibold text-[#C9A227]">
                      {membership.year_start ?? ''}
                    </bdi>

                    <div className="flex-1 min-w-0">
                      <p className="m-0 text-[15px] font-medium leading-[1.5] text-[#12233C]">
                        {isRTL
                          ? membership.organization_ar || membership.organization_en
                          : membership.organization_en}
                      </p>

                      {(membership.role_en || membership.role_ar) && (
                        <p className="m-0 mt-[2px] text-[13px] text-[#8C9BB2]">
                          {isRTL ? membership.role_ar || membership.role_en : membership.role_en}
                        </p>
                      )}
                    </div>

                    {membership.is_current && (
                      <span className="flex-[0_0_auto] text-[11.5px] font-semibold text-[#9C7C15] bg-[rgba(201,162,39,.14)] px-[9px] py-[3px] rounded-[2px]">
                        {t.active}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* =====================================================
              COMMITTEES
          ===================================================== */}
          <Section id="committees" number="06" title={t.committees} isRTL={isRTL}>
            {committees.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {committees.map((committee) => (
                  <div
                    key={committee.id}
                    className="bg-white border border-[#E4EAF3] px-[22px] py-5"
                  >
                    {(committee.role_en || committee.role_ar) && (
                      <p className="m-0 mb-[6px] text-[12.5px] font-semibold text-[#C9A227]">
                        {isRTL ? committee.role_ar || committee.role_en : committee.role_en}
                      </p>
                    )}

                    <h3 className="m-0 mb-[6px] font-serif text-[16.5px] font-semibold leading-[1.45] text-[#12233C]">
                      {isRTL ? committee.name_ar || committee.name_en : committee.name_en}
                    </h3>

                    {(committee.institution_en || committee.institution_ar) && (
                      <p className="m-0 mb-[10px] text-[13.5px] text-[#52627A]">
                        {isRTL
                          ? committee.institution_ar || committee.institution_en
                          : committee.institution_en}
                      </p>
                    )}

                    {(committee.year_start || committee.year_end) && (
                      <bdi dir="ltr" className="block text-[12.5px] text-[#8C9BB2]">
                        {yearRange(committee.year_start, committee.year_end, committee.is_current)}
                      </bdi>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* =====================================================
              CONFERENCES
          ===================================================== */}
          <Section id="conferences" number="07" title={t.conferences} isRTL={isRTL}>
            {conferences.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {conferences.map((conference) => (
                  <div key={conference.id} className="flex gap-[22px] py-5 border-b border-[#E7ECF4]">
                    <bdi dir="ltr" className="flex-[0_0_64px] font-serif text-[22px] font-semibold leading-[1.2] text-[#12233C]">
                      {conference.year ?? ''}
                    </bdi>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-[10px] flex-wrap mb-1">
                        <span className="text-[11.5px] font-semibold text-[#52627A] bg-[#EEF2F8] px-[9px] py-[3px] rounded-[2px]">
                          {conference.role}
                        </span>

                        {conference.location && (
                          <span className="text-[12.5px] text-[#8C9BB2]">
                            {conference.location}
                            {conference.country && `, ${conference.country}`}
                          </span>
                        )}
                      </div>

                      <p className="m-0 mb-1 font-medium text-[15px] leading-[1.55] text-[#12233C]">
                        {isRTL ? conference.name_ar || conference.name_en : conference.name_en}
                      </p>

                      {conference.paper_title && (
                        <p className="m-0 font-serif italic text-[14px] leading-[1.7] text-[#52627A]">
                          {conference.paper_title}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* =====================================================
              SUPERVISION
          ===================================================== */}
          <Section id="supervision" number="08" title={t.supervision} isRTL={isRTL}>
            {supervision.length === 0 ? (
              <Empty isRTL={isRTL} text={t.noData} />
            ) : (
              <div className="flex flex-col">
                {supervision.map((student) => (
                  <div
                    key={student.id}
                    className="flex gap-5 items-start py-[19px] border-b border-[#E7ECF4]"
                  >
                    <span className="flex-[0_0_auto] min-w-[46px] text-center text-[11.5px] font-semibold text-[#12233C] bg-[#EEF2F8] px-[9px] py-1 rounded-[2px]">
                      {student.degree_level}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="m-0 mb-[3px] text-[15px] font-medium leading-[1.5] text-[#12233C]">
                        {student.student_name}
                      </p>

                      {(student.thesis_title_en || student.thesis_title_ar) && (
                        <p className="m-0 mb-[6px] font-serif italic text-[14px] leading-[1.7] text-[#52627A]">
                          {isRTL
                            ? student.thesis_title_ar || student.thesis_title_en
                            : student.thesis_title_en}
                        </p>
                      )}

                      <bdi dir="ltr" className="block text-[12.5px] text-[#8C9BB2]">
                        {student.institution || ''}
                        {student.institution && (student.year_start || student.year_end) && ' · '}
                        {yearRange(student.year_start, student.year_end)}
                      </bdi>
                    </div>

                    <span
                      className={`flex-[0_0_auto] text-[11.5px] font-semibold px-[9px] py-[3px] rounded-[2px] ${
                        student.status === 'completed'
                          ? 'text-[#2F6B4A] bg-[rgba(47,107,74,.10)]'
                          : 'text-[#9C7C15] bg-[rgba(201,162,39,.14)]'
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
   SECTION HEADER
   FIX: gradient direction flips based on RTL
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
    <section id={id} className="scroll-mt-[100px]">
      <div className="flex items-baseline gap-[14px] mb-2">
        <span dir="ltr" className="font-serif italic text-[15px] text-[#C9A227]">
          {number}
        </span>

        <h2 className="m-0 font-serif text-[clamp(24px,3.2vw,30px)] font-semibold leading-[1.25] text-[#12233C]">
          {title}
        </h2>
      </div>

      {/* FIX: gradient direction respects RTL */}
      <div
        className="h-px mb-[26px]"
        style={{
          background: isRTL
            ? 'linear-gradient(to left, #C9A227 0px, #C9A227 56px, #E2E8F1 56px, #E2E8F1 100%)'
            : 'linear-gradient(to right, #C9A227 0px, #C9A227 56px, #E2E8F1 56px, #E2E8F1 100%)',
        }}
      />

      {children}
    </section>
  )
}

/* =============================================================
   EMPTY STATE
============================================================= */
function Empty({ isRTL, text }: { isRTL: boolean; text: string }) {
  return (
    <p className={`m-0 py-4 text-[14px] text-[#8C9BB2] ${isRTL ? 'text-right' : 'text-left'}`}>
      {text}
    </p>
  )
}