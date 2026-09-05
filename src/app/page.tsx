'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { Profile, Publication, NewsActivity, ResearchInterest } from '@/lib/types'

export default function HomePage() {
  const { lang, isRTL } = useLang()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [publications, setPublications] = useState<Publication[]>([])
  const [allPubCount, setAllPubCount] = useState<number>(0)
  const [totalCitations, setTotalCitations] = useState<number>(0)
  const [news, setNews] = useState<NewsActivity[]>([])
  const [interests, setInterests] = useState<ResearchInterest[]>([])
  const [loading, setLoading] = useState(true)
  const researchRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const [profileRes, pubRes, allPubRes, newsRes, interestsRes] = await Promise.all([
        supabase.from('profile').select('*').single(),
        supabase.from('publications').select('*').order('year', { ascending: false }).order('created_at', { ascending: false }).limit(4),
        supabase.from('publications').select('id, citation_count'),
        supabase.from('news_activities').select('*').order('activity_date', { ascending: false }).limit(4),
        supabase.from('research_interests').select('*').order('sort_order'),
      ])
      if (profileRes.data) setProfile(profileRes.data)
      if (pubRes.data) setPublications(pubRes.data)
      if (allPubRes.data) {
        setAllPubCount(allPubRes.data.length)
        setTotalCitations(allPubRes.data.reduce((sum: number, p: any) => sum + (p.citation_count ?? 0), 0))
      }
      if (newsRes.data) setNews(newsRes.data)
      if (interestsRes.data) setInterests(interestsRes.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const t = useMemo(() => isRTL ? {
    welcome: 'مرحباً بك في صفحتي الأكاديمية',
    exploreResearch: 'استكشف أبحاثي',
    viewPublications: 'المنشورات',
    topBadge: 'من أفضل 2% من الباحثين الأكثر تأثيراً في العالم',
    researchAreas: 'مجالات البحث',
    frontiers: 'آفاق في الرياضيات التطبيقية',
    recentWork: 'أعمال حديثة',
    featuredPublications: 'أبحاث مختارة',
    viewAllPublications: 'جميع الأبحاث',
    newsAchievements: 'أخبار وإنجازات',
    latestNews: 'آخر الأخبار والنشاطات',
    publications: 'بحث منشور',
    citations: 'اقتباس',
    researchArea: 'مجال بحثي',
    worldRanking: 'التصنيف العالمي',
    noPublications: 'لا توجد أبحاث منشورة بعد.',
    noNews: 'لا توجد نشاطات حديثة بعد.',
  } : {
    welcome: 'Welcome to my academic home',
    exploreResearch: 'Explore My Research',
    viewPublications: 'View Publications',
    topBadge: "Top 2% of World's Most Influential Researchers",
    researchAreas: 'Research areas',
    frontiers: 'Exploring Mathematical Frontiers',
    recentWork: 'Recent work',
    featuredPublications: 'Featured Publications',
    viewAllPublications: 'View All Publications',
    newsAchievements: 'News & achievements',
    latestNews: 'Latest News & Activities',
    publications: 'Publications',
    citations: 'Citations',
    researchArea: 'Research Areas',
    worldRanking: 'World Ranking',
    noPublications: 'No publications yet.',
    noNews: 'No recent activities yet.',
  }, [isRTL])

  const fullName = isRTL ? profile?.name_ar || profile?.name_en || 'أ.د. أحمد العجو' : profile?.name_en || 'Prof. Ahmad El-Ajou'
  const profileTitle = isRTL ? profile?.title_ar || profile?.title_en : profile?.title_en || 'Full Professor of Mathematics'
  const displayBio = (isRTL ? profile?.bio_ar || profile?.bio_en : profile?.bio_en) || (isRTL
    ? 'أستاذ في قسم الرياضيات بجامعة البلقاء التطبيقية. يُصنَّف ضمن أفضل 2% من الباحثين الأكثر تأثيراً في العالم وفق بيانات جامعة ستانفورد وإلسفير.'
    : "Full Professor of Mathematics at Al-Balqa Applied University, Jordan. Ranked in the top 2% of the world's most influential researchers according to Stanford University and Elsevier.")

  const socialProfiles = [
    { label: 'Google Scholar', mark: 'GS', href: profile?.google_scholar_url || 'https://scholar.google.com/citations?user=j2NXhlQAAAAJ&hl=en' },
    { label: 'ORCID', mark: 'iD', href: profile?.orcid_url || 'https://orcid.org/0000-0002-7470-8162' },
    { label: 'ResearchGate', mark: 'RG', href: profile?.researchgate_url || 'https://www.researchgate.net/profile/Ahmad_El-Ajou2' },
    { label: 'LinkedIn', mark: 'in', href: profile?.linkedin_url || 'https://jo.linkedin.com/in/ahmad-el-ajou-84983974' },
  ]

  const researchSymbols = ['Dα', '∂α', '∫', 'Σ', '≈', 'μ', 'f(x)', 'X′']
  const fallbackAreas = isRTL
    ? ['حساب التفاضل الكسري', 'المعادلات التفاضلية الكسرية', 'المعادلات التفاضلية والتكاملية', 'التحليل العددي والأساليب العددية', 'الأساليب التحليلية التقريبية', 'المعادلات التفاضلية الضبابية', 'النمذجة الرياضية', 'منظومة المعادلات المصفوفية']
    : ['Fractional Calculus', 'Fractional Differential Equations', 'Ordinary and Partial Diff. Equations', 'Numerical Analysis & Methods', 'Analytic & Approximate Methods', 'Fuzzy Differential Equations', 'Mathematical Modelling', 'System of Matrix Diff. Equations']

  const researchAreas: ResearchInterest[] = interests.length ? interests : fallbackAreas.map((label, i) => ({
    id: `fallback-${i}`, name_ar: fallbackAreas[i], name_en: fallbackAreas[i], sort_order: i + 1,
  } as ResearchInterest))

  const metrics = [
    { sym: '∫', value: allPubCount ? `${allPubCount}+` : '25+', label: t.publications },
    { sym: '∞', value: totalCitations ? `${totalCitations}+` : '200+', label: t.citations },
    { sym: 'Σ', value: `${Math.max(interests.length, 6)}+`, label: t.researchArea },
    { sym: '★', value: isRTL ? 'أفضل 2%' : 'Top 2%', label: t.worldRanking },
  ]

  const scrollResearch = (dir: 'back' | 'forward') => {
    if (!researchRef.current) return
    const amount = researchRef.current.clientWidth * 0.8
    researchRef.current.scrollBy({ left: dir === 'back' ? (isRTL ? amount : -amount) : (isRTL ? -amount : amount), behavior: 'smooth' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A1A30' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(201,168,76,0.3)', borderTopColor: '#C9A227', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <p style={{ color: '#D9B45B', fontSize: 14 }}>{isRTL ? 'جارٍ التحميل...' : 'Loading...'}</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style jsx global>{`
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{margin:0;padding:0;overflow-x:hidden;background:#0a1a30;color:#16233a;font-family:'Source Serif 4',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        a{text-decoration:none}
        ::selection{background:rgba(201,162,39,0.25)}
        .ac-display{font-family:'EB Garamond',Georgia,serif}
        .ac-arabic{font-family:'Noto Naskh Arabic',serif}
        .rscroll::-webkit-scrollbar{display:none}
        .rscroll{scrollbar-width:none;-ms-overflow-style:none}

        /* ── DESKTOP (>768px) ── */
        .mobile-only{display:none!important}
        .desktop-only{display:block}

        /* ── MOBILE (≤768px) ── */
        @media(max-width:768px){
          .desktop-only{display:none!important}
          .mobile-only{display:block!important}
          /* ضمان عدم خروج أي عنصر من الشاشة */
          .page-wrap{padding-top:64px!important}
          .page-wrap *{max-width:100%;word-break:break-word}
        }
      `}</style>

      <div className="page-wrap" style={{ paddingTop: 64, overflowX: 'hidden' }}>

        {/* ═══════════════════════════════════
            DESKTOP HERO
        ═══════════════════════════════════ */}
        <div className="desktop-only" style={{ position: 'relative', background: 'radial-gradient(125% 95% at 64% 36%,#153A61 0%,#0E2846 38%,#0A1B31 72%,#061020 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05, backgroundImage: 'repeating-linear-gradient(to right,rgba(255,255,255,0.6) 0 1px,transparent 1px 72px),repeating-linear-gradient(to bottom,rgba(255,255,255,0.6) 0 1px,transparent 1px 72px)' }} />
          <section style={{ position: 'relative', maxWidth: 1220, margin: '0 auto', padding: '34px 26px 0' }}>
            <div dir={isRTL ? 'rtl' : 'ltr'} style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', minHeight: 'clamp(460px,64vh,620px)' }}>
              {/* TEXT */}
              <div style={{ flex: '1 1 400px', minWidth: 0, maxWidth: 600, paddingBlock: '0 8px' }}>
                <p style={{ margin: '0 0 20px', fontSize: 12.5, fontWeight: 600, color: '#C9A227', letterSpacing: isRTL ? 0 : '0.12em', textTransform: isRTL ? 'none' : 'uppercase' }}>{t.welcome}</p>
                <h1 className={isRTL ? 'ac-arabic' : 'ac-display'} style={{ margin: '0 0 24px', fontSize: 'clamp(30px,4.2vw,54px)', lineHeight: 1.14, fontWeight: 600, color: '#FFF', letterSpacing: isRTL ? 0 : '-0.012em' }}>{fullName}</h1>
                <div style={{ width: 64, height: 3, background: '#C9A227', marginBottom: 26 }} />
                <p style={{ margin: '0 0 34px', fontSize: 15.5, lineHeight: 1.8, color: '#AEBBCC', maxWidth: '60ch' }}>{displayBio}</p>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 30 }}>
                  <Link href="/research" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#C9A227', color: '#0A1A30', fontSize: 14.5, fontWeight: 600, padding: '15px 24px', borderRadius: 4, minHeight: 48 }}>{t.exploreResearch} <span>{isRTL ? '←' : '→'}</span></Link>
                  <Link href="/publications" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, border: '1px solid rgba(255,255,255,0.4)', color: '#FFF', fontSize: 14.5, fontWeight: 500, padding: '15px 24px', borderRadius: 4, minHeight: 48 }}>{t.viewPublications}</Link>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {socialProfiles.map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: '#C4CFDE' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#D9B45B', flexShrink: 0 }}>{s.mark}</span>
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
              {/* PORTRAIT */}
              <div style={{ flex: '1 1 390px', minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transform: 'translateY(18px)' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.18, color: '#D9B45B', fontFamily: "'EB Garamond',serif", fontStyle: 'italic' }}>
                  <span style={{ position: 'absolute', top: '10%', left: '2%', fontSize: 21 }}>∂u/∂t + αD<sup>α</sup>u = f(t)</span>
                  <span style={{ position: 'absolute', top: '38%', right: '0%', fontSize: 18 }}>∫<sub>0</sub><sup>∞</sup> e<sup>−xt</sup>f(t)dt</span>
                  <span style={{ position: 'absolute', bottom: '28%', left: '2%', fontSize: 20 }}>X′ = AX</span>
                </div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', width: 'min(400px,88%)', aspectRatio: '1', border: '1px solid rgba(201,162,39,0.28)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 2, width: 'min(340px,76%)', aspectRatio: '0.82', borderRadius: 6, overflow: 'hidden', background: 'linear-gradient(145deg,#183A5D,#0A1A30)', border: '1px solid rgba(201,162,39,0.35)', boxShadow: '0 35px 70px rgba(0,0,0,0.45)' }}>
                  {profile?.photo_url ? <img src={profile.photo_url} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D9B45B', fontSize: 80, fontFamily: "'EB Garamond',serif", fontStyle: 'italic' }}>A</div>}
                </div>
                <div style={{ position: 'relative', zIndex: 4, width: 'min(340px,76%)', display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'rgba(7,18,34,0.92)', border: '1px solid rgba(201,162,39,0.35)', borderRadius: 5, backdropFilter: 'blur(8px)' }}>
                  <span style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#D9B45B', flexShrink: 0, background: 'rgba(201,162,39,0.08)' }}>♛</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5, color: '#DCE5F0', fontWeight: 500 }}>{t.topBadge}</span>
                </div>
              </div>
            </div>
            {/* DESKTOP STATS */}
            <div dir={isRTL ? 'rtl' : 'ltr'} style={{ position: 'relative', zIndex: 6, marginTop: 56, transform: 'translateY(50%)', background: '#0E2542', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, boxShadow: '0 24px 50px rgba(4,12,24,0.45)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
              {metrics.map((m, i) => (
                <div key={m.label} style={{ padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 15, borderInlineStart: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="ac-display" style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, color: '#D9B45B', flexShrink: 0 }}>{m.sym}</span>
                  <div>
                    <bdi dir="ltr" style={{ display: 'block', fontFamily: "'EB Garamond',serif", fontSize: 27, fontWeight: 600, color: '#FFF', lineHeight: 1.1 }}>{m.value}</bdi>
                    <div style={{ fontSize: 13, color: '#8C9BB2', marginTop: 3 }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ═══════════════════════════════════
            MOBILE HERO
        ═══════════════════════════════════ */}
        <div className="mobile-only" dir={isRTL ? 'rtl' : 'ltr'} style={{ background: '#0A1B31', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>

          {/* 1. PHOTO BANNER */}
          <div style={{ position: 'relative', height: 360, width: '100%', overflow: 'hidden', background: 'linear-gradient(145deg,#0E2846,#0A1A30)' }}>
            {profile?.photo_url && (
              <img src={profile.photo_url} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(10,27,49,0) 30%,rgba(10,27,49,0.6) 65%,rgba(10,27,49,1) 100%)' }} />
            <div style={{ position: 'absolute', top: 16, right: isRTL ? 'auto' : 16, left: isRTL ? 16 : 'auto', opacity: 0.15, color: '#C9A227', fontFamily: "'EB Garamond',serif", fontStyle: 'italic', fontSize: 13, lineHeight: 1.8, textAlign: isRTL ? 'left' : 'right' }}>
              <div>E<sub>α,β</sub>(z) = Σ z<sup>k</sup>/Γ(αk+β)</div>
              <div>D<sup>α</sup>u = f(t,u)</div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 24px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 10.5, fontWeight: 600, color: '#C9A227', letterSpacing: '0.1em', textTransform: isRTL ? 'none' : 'uppercase' }}>{t.welcome}</p>
              <h1 className={isRTL ? 'ac-arabic' : 'ac-display'} style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 600, color: '#FFF', lineHeight: 1.2 }}>{fullName}</h1>
              <p style={{ margin: 0, fontSize: 13.5, color: '#AEBBCC' }}>{profileTitle}</p>
            </div>
          </div>

          {/* كل ما يلي داخل padding موحد */}
          <div style={{ padding: '0 16px', boxSizing: 'border-box', width: '100%' }}>

            {/* 2. TOP 2% BADGE */}
            <div style={{ transform: 'translateY(-20px)' }}>
              <div style={{ background: 'rgba(6,16,32,0.97)', border: '1px solid rgba(201,162,39,0.45)', borderRadius: 8, padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#D9B45B', flexShrink: 0, background: 'rgba(201,162,39,0.1)' }}>♛</span>
                <span style={{ fontSize: 13, lineHeight: 1.5, color: '#DCE5F0', fontWeight: 500 }}>{t.topBadge}</span>
              </div>
            </div>

            {/* 3. STATS 2×2 */}
            <div style={{ background: '#0E2542', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', marginTop: 4 }}>
              {metrics.map((m, i) => (
                <div key={m.label} style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', gap: 8, borderInlineStart: i % 2 !== 0 ? '1px solid rgba(255,255,255,0.07)' : 'none', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.07)' : 'none', minWidth: 0, overflow: 'hidden' }}>
                  <span className="ac-display" style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#D9B45B', flexShrink: 0 }}>{m.sym}</span>
                  <div style={{ minWidth: 0 }}>
                    <bdi dir="ltr" style={{ display: 'block', fontFamily: "'EB Garamond',serif", fontSize: 20, fontWeight: 600, color: '#FFF', lineHeight: 1.1 }}>{m.value}</bdi>
                    <div style={{ fontSize: 10.5, color: '#8C9BB2', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. BIO */}
            <div style={{ marginTop: 20, background: '#F6F8FC', borderRadius: 10, padding: '18px 16px', borderInlineStart: '3px solid #C9A227' }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: '#3D4C63' }}>{displayBio}</p>
            </div>

            {/* 5. CTAs */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/research" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#C9A227', color: '#0A1A30', fontSize: 15, fontWeight: 600, padding: '15px 20px', borderRadius: 6 }}>
                {t.exploreResearch} <span>{isRTL ? '←' : '→'}</span>
              </Link>
              <Link href="/publications" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.25)', color: '#FFF', fontSize: 15, fontWeight: 500, padding: '15px 20px', borderRadius: 6 }}>
                {t.viewPublications}
              </Link>
            </div>

            {/* 6. SOCIAL */}
            <div style={{ marginTop: 16, marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {socialProfiles.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#C4CFDE', fontWeight: 500, minWidth: 0, overflow: 'hidden' }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#D9B45B', flexShrink: 0 }}>{s.mark}</span>
                  <span style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                </a>
              ))}
            </div>

          </div>{/* end padding wrapper */}
        </div>

        {/* ═══════════════════════════════════
            RESEARCH AREAS — مشترك
        ═══════════════════════════════════ */}
        <section id="research" style={{ background: '#F6F8FC', padding: 'clamp(48px,8vw,112px) 20px 56px' }} dir={isRTL ? 'rtl' : 'ltr'}>
          <div style={{ maxWidth: 1220, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#C9A227', letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase' }}>{t.researchAreas}</p>
                <h2 className={isRTL ? 'ac-arabic' : 'ac-display'} style={{ margin: '0 0 10px', fontSize: 'clamp(22px,3.6vw,34px)', fontWeight: 600, lineHeight: 1.2, color: '#12233C' }}>{t.frontiers}</h2>
                <div style={{ width: 48, height: 3, background: '#C9A227' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => scrollResearch('back')} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(18,35,60,0.14)', background: 'transparent', color: '#52627A', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <button onClick={() => scrollResearch('forward')} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(18,35,60,0.14)', background: 'transparent', color: '#52627A', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              </div>
            </div>
            <div ref={researchRef} className="rscroll" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4, scrollSnapType: 'x mandatory' }}>
              {researchAreas.map((area, i) => (
                <div key={area.id} style={{ flex: '0 0 min(72vw,200px)', scrollSnapAlign: 'start', background: '#FFF', border: '1px solid #E8EDF4', borderRadius: 6, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                  <span dir="ltr" className="ac-display" style={{ fontStyle: 'italic', fontSize: 26, color: '#12233C', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i === 0 ? <>D<sup style={{ fontSize: '0.55em' }}>α</sup></> : researchSymbols[i] || 'Σ'}
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.55, color: '#42546E', fontWeight: 500 }}>{isRTL ? area.name_ar || area.name_en : area.name_en || area.name_ar}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            PUBLICATIONS — مشترك
        ═══════════════════════════════════ */}
        <section id="publications" style={{ background: '#FFF', padding: '56px 20px' }} dir={isRTL ? 'rtl' : 'ltr'}>
          <div style={{ maxWidth: 1220, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
              <div>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#C9A227', letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase' }}>{t.recentWork}</p>
                <h2 className={isRTL ? 'ac-arabic' : 'ac-display'} style={{ margin: '0 0 10px', fontSize: 'clamp(22px,3.6vw,34px)', fontWeight: 600, lineHeight: 1.2, color: '#12233C' }}>{t.featuredPublications}</h2>
                <div style={{ width: 48, height: 3, background: '#C9A227' }} />
              </div>
              <Link href="/publications" style={{ fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, color: '#C9A227' }}>
                {t.viewAllPublications} <span>{isRTL ? '←' : '→'}</span>
              </Link>
            </div>
            {publications.length === 0 ? <p style={{ color: '#8894A6', fontSize: 14 }}>{t.noPublications}</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
                {publications.map((pub, i) => (
                  <article key={pub.id} dir="ltr" style={{ background: '#FFF', border: '1px solid #E4EAF3', borderRadius: 8, padding: 18, display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 1px 3px rgba(18,35,60,0.05)' }}>
                    <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 600, color: '#1D3A63', background: '#EEF3FA', borderRadius: 4, padding: '4px 8px' }}>{String(i + 1).padStart(2, '0')}</span>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.55, color: '#12233C' }}>{pub.title_en}</h3>
                    <p style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: '#6B7A90' }}>{pub.authors}</p>
                    {pub.journal_name && <p style={{ margin: 'auto 0 0', fontSize: 12, fontStyle: 'italic', color: '#C9A227' }}>{pub.journal_name}</p>}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', fontSize: 11.5, color: '#8894A6' }}>
                      <span>{pub.year}</span>
                      {pub.citation_count != null && pub.citation_count > 0 && <span>{pub.citation_count} {t.citations.toLowerCase()}</span>}
                      {pub.doi && <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#C9A227' }}>DOI</a>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════
            NEWS — مشترك
        ═══════════════════════════════════ */}
        <section id="news" style={{ background: 'linear-gradient(165deg,#0B1C33 0%,#0C2340 60%,#0A1A30 100%)', padding: '56px 20px' }} dir={isRTL ? 'rtl' : 'ltr'}>
          <div style={{ maxWidth: 1220, margin: '0 auto' }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#C9A227', letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase' }}>{t.newsAchievements}</p>
            <h2 className={isRTL ? 'ac-arabic' : 'ac-display'} style={{ margin: '0 0 10px', fontSize: 'clamp(22px,3.6vw,34px)', fontWeight: 600, lineHeight: 1.2, color: '#FFF' }}>{t.latestNews}</h2>
            <div style={{ width: 48, height: 3, background: '#C9A227', marginBottom: 28 }} />
            {news.length === 0 ? <p style={{ color: '#8C9BB2', fontSize: 14 }}>{t.noNews}</p> : (
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {/* بطاقة رئيسية */}
                <div style={{ flex: '1 1 300px', minWidth: 0, background: 'rgba(7,18,34,0.72)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '22px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                      {news[0].activity_type && <span style={{ fontSize: 11, color: '#D9B45B', border: '1px solid rgba(201,162,39,0.4)', borderRadius: 3, padding: '3px 8px', fontWeight: 500 }}>{news[0].activity_type}</span>}
                      {news[0].activity_date && <span style={{ fontSize: 11.5, color: '#8C9BB2' }}>{new Date(news[0].activity_date).toLocaleDateString(isRTL ? 'ar-JO' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                    </div>
                    <h3 className={isRTL ? 'ac-arabic' : 'ac-display'} style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 600, lineHeight: 1.4, color: '#FFF' }}>{isRTL ? news[0].title_ar || news[0].title_en : news[0].title_en}</h3>
                    {(news[0].content_en || news[0].content_ar) && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: '#AEBBCC' }}>{isRTL ? news[0].content_ar || news[0].content_en : news[0].content_en}</p>}
                  </div>
                  <span style={{ flexShrink: 0, width: 56, height: 56, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#D9B45B', background: 'rgba(201,162,39,0.08)' }}>♛</span>
                </div>
                {/* بطاقات جانبية */}
                {news.slice(1).length > 0 && (
                  <div style={{ flex: '1 1 300px', minWidth: 0, borderRadius: 10, border: '1px solid rgba(255,255,255,0.09)', background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.03) 0 10px,rgba(255,255,255,0.015) 10px 20px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {news.slice(1).map((item, i) => (
                      <div key={item.id} style={{ padding: '16px 20px', borderBottom: i < news.slice(1).length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flex: 1 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                            {item.activity_type && <span style={{ fontSize: 10.5, color: '#D9B45B', border: '1px solid rgba(201,162,39,0.35)', borderRadius: 3, padding: '2px 6px' }}>{item.activity_type}</span>}
                            {item.activity_date && <span style={{ fontSize: 11, color: '#8C9BB2' }}>{new Date(item.activity_date).toLocaleDateString(isRTL ? 'ar-JO' : 'en-US', { year: 'numeric', month: 'short' })}</span>}
                          </div>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, lineHeight: 1.55, color: '#DCE5F0' }}>{isRTL ? item.title_ar || item.title_en : item.title_en}</p>
                        </div>
                        <ArrowUpRight size={13} style={{ color: '#C9A227', flexShrink: 0, marginTop: 2 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

      </div>
    </>
  )
}