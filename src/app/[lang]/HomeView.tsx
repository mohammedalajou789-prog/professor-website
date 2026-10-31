'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import MathField from '@/components/motion/MathField'
import CountUp from '@/components/motion/CountUp'
import AreaGrid from '@/components/research/AreaGrid'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { Profile, Publication, NewsActivity, ResearchInterest } from '@/lib/types'

type Props = {
  profile: Profile | null
  publications: Publication[]
  allPubCount: number
  totalCitations: number
  news: NewsActivity[]
  interests: ResearchInterest[]
}

function SectionHead({ eyebrow, title, href, more, isRTL }: { eyebrow: string; title: string; href: string; more: string; isRTL: boolean }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className={`mb-2 text-[12px] font-semibold text-gold-ink ${isRTL ? '' : 'uppercase tracking-[.1em]'}`}>{eyebrow}</p>
        <h2 className={`mb-2.5 text-[clamp(22px,3.6vw,34px)] font-semibold leading-tight text-ink ${isRTL ? 'font-arabic' : 'font-display'}`}>{title}</h2>
        <div className="bar2" />
      </div>
      <Link href={href} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-4 py-2 text-[13.5px] font-semibold text-link transition hover:border-link/40">
        {more} <span>{isRTL ? '←' : '→'}</span>
      </Link>
    </div>
  )
}

export default function HomeView({ profile, publications, allPubCount, totalCitations, news, interests }: Props) {
  const { isRTL } = useLang()

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


  return (
    <>
      <style jsx global>{`
        
        a{text-decoration:none}
        ::selection{background:rgba(201,162,39,0.25)}
        .ac-display{font-family:var(--font-display)}
        .ac-arabic{font-family:var(--font-ar)}
        .hin{animation:page-in .9s var(--ease-out) both;animation-delay:var(--d,0ms)}
        .hin-bar{transform-origin:left;animation:bar-in 1s var(--ease-out) .3s both}
        [dir=rtl] .hin-bar{transform-origin:right}
        @keyframes bar-in{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        .eq-float{animation:float-y 7s ease-in-out infinite}
        .orbit{transform:translate(-50%,-50%);animation:orbit-spin 60s linear infinite}
        @keyframes orbit-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}
        .portrait{transition:transform .6s var(--ease-out)}
        .portrait:hover{transform:translateY(-4px)}
        .portrait .corner{position:absolute;width:26px;height:26px;border-color:#E3C566;border-style:solid;opacity:.9}
        .portrait .corner.tl{top:10px;left:10px;border-width:2px 0 0 2px}
        .portrait .corner.br{bottom:10px;right:10px;border-width:0 2px 2px 0}
        .ring{position:absolute;inset:-1px;border-radius:50%;border:1px solid rgba(227,197,102,.7);animation:pulse-ring 2.4s ease-out infinite}
        .kenburns{animation:kb 18s ease-in-out infinite alternate}
        @keyframes kb{from{transform:scale(1.02)}to{transform:scale(1.09)}}
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
          
          .page-wrap *{max-width:100%;word-break:break-word}
        }
      `}</style>

      <div className="page-wrap" style={{ overflowX: 'hidden' }}>

        {/* ═══════════════════════════════════
            DESKTOP HERO
        ═══════════════════════════════════ */}
        <div className="desktop-only" style={{ position: 'relative', background: 'radial-gradient(40% 55% at 72% 38%, rgba(18,164,217,.22) 0%, transparent 70%), radial-gradient(125% 95% at 64% 36%,#153A61 0%,#0E2846 38%,#0A1B31 72%,#061020 100%)' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05, backgroundImage: 'repeating-linear-gradient(to right,rgba(255,255,255,0.6) 0 1px,transparent 1px 72px),repeating-linear-gradient(to bottom,rgba(255,255,255,0.6) 0 1px,transparent 1px 72px)' }} />
          <MathField variant="spiral" className="absolute inset-0 h-full w-full opacity-70" />
          <section className="wrap" style={{ position: 'relative', paddingTop: 34 }}>
            <div dir={isRTL ? 'rtl' : 'ltr'} style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', minHeight: 'clamp(460px,64vh,620px)' }}>
              {/* TEXT */}
              <div style={{ flex: '1 1 400px', minWidth: 0, maxWidth: 600, paddingBlock: '0 8px' }}>
                <p className="hin" style={{ ['--d' as any]: '60ms', margin: '0 0 20px', fontSize: 12.5, fontWeight: 600, color: '#C9A227', letterSpacing: isRTL ? 0 : '0.12em', textTransform: isRTL ? 'none' : 'uppercase' }}>{t.welcome}</p>
                <h1 className={`hin ${isRTL ? 'ac-arabic' : 'ac-display'}`} style={{ ['--d' as any]: '140ms', margin: '0 0 24px', fontSize: 'clamp(30px,4.2vw,54px)', lineHeight: 1.14, fontWeight: 600, color: '#FFF', letterSpacing: isRTL ? 0 : '-0.012em' }}>{fullName}</h1>
                <div className="hin-bar" style={{ width: 64, height: 3, background: '#C9A227', marginBottom: 26 }} />
                <p className="hin" style={{ ['--d' as any]: '240ms', margin: '0 0 34px', fontSize: 15.5, lineHeight: 1.8, color: '#AEBBCC', maxWidth: '60ch' }}>{displayBio}</p>
                <div className="hin" style={{ ['--d' as any]: '330ms', display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 30 }}>
                  <Link href="/research" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: '#C9A227', color: '#0A1A30', fontSize: 14.5, fontWeight: 600, padding: '15px 24px', borderRadius: 4, minHeight: 48 }}>{t.exploreResearch} <span>{isRTL ? '←' : '→'}</span></Link>
                  <Link href="/publications" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, border: '1px solid rgba(255,255,255,0.4)', color: '#FFF', fontSize: 14.5, fontWeight: 500, padding: '15px 24px', borderRadius: 4, minHeight: 48 }}>{t.viewPublications}</Link>
                </div>
                <div className="hin" style={{ ['--d' as any]: '420ms', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {socialProfiles.map(s => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: '#C4CFDE' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#D9B45B', flexShrink: 0 }}>{s.mark}</span>
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
              {/* PORTRAIT */}
              <div className="hin" style={{ ['--d' as any]: '200ms', flex: '1 1 390px', minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transform: 'translateY(18px)' }}>
                <div aria-hidden dir="ltr" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', color: '#D9B45B', fontFamily: "var(--font-display)", fontStyle: 'italic' }}>
                  <span className="eq-float" style={{ position: 'absolute', top: '8%', left: '0%', fontSize: 21, opacity: 0.22 }}>∂u/∂t + αD<sup>α</sup>u = f(t)</span>
                  <span className="eq-float" style={{ position: 'absolute', top: '40%', right: '-2%', fontSize: 18, opacity: 0.2, animationDelay: '-2s' }}>∫<sub>0</sub><sup>∞</sup> e<sup>−st</sup>f(t)dt</span>
                  <span className="eq-float" style={{ position: 'absolute', bottom: '26%', left: '0%', fontSize: 22, opacity: 0.24, animationDelay: '-4s' }}>X′ = AX</span>
                </div>
                <div aria-hidden className="orbit" style={{ position: 'absolute', top: '50%', left: '50%', width: 'min(430px,92%)', aspectRatio: '1', marginTop: -28 }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(201,162,39,.28)" strokeWidth=".25" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(174,196,224,.14)" strokeWidth=".2" strokeDasharray="1 2" />
                    <circle cx="50" cy="1" r="1.1" fill="#E3C566" />
                    <circle cx="94" cy="50" r=".7" fill="rgba(227,197,102,.6)" />
                  </svg>
                </div>
                <div className="portrait" style={{ position: 'relative', zIndex: 2, width: 'min(340px,76%)', aspectRatio: '0.8', borderRadius: 8, overflow: 'hidden', background: '#0E2846', border: '1px solid rgba(201,162,39,0.45)', boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 6px rgba(201,162,39,0.06)' }}>
                  <Image src="/images/prof-portrait.jpg" alt={fullName} fill priority sizes="(max-width: 1100px) 300px, 340px" style={{ objectFit: 'cover', objectPosition: '50% 20%' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,27,49,0) 55%, rgba(10,27,49,.55) 100%)' }} />
                  <span className="corner tl" /><span className="corner br" />
                </div>
                <div style={{ position: 'relative', zIndex: 4, width: 'min(340px,76%)', display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'rgba(7,18,34,0.92)', border: '1px solid rgba(201,162,39,0.35)', borderRadius: 6, backdropFilter: 'blur(8px)' }}>
                  <span style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(201,162,39,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#D9B45B', flexShrink: 0, background: 'rgba(201,162,39,0.08)' }}>♛<span className="ring" /></span>
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
                    <bdi dir={/[\u0600-\u06FF]/.test(m.value) ? 'rtl' : 'ltr'} style={{ display: 'block', fontFamily: "var(--font-display)", fontSize: 27, fontWeight: 600, color: '#FFF', lineHeight: 1.1 }}><CountUp value={m.value} /></bdi>
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
            <Image src="/images/prof-portrait.jpg" alt={fullName} fill priority sizes="(max-width: 768px) 100vw, 10px" className="kenburns" style={{ objectFit: 'cover', objectPosition: '50% 18%' }} />
            <MathField variant="spiral" className="absolute inset-0 h-full w-full opacity-50" density={0.6} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(10,27,49,0) 30%,rgba(10,27,49,0.6) 65%,rgba(10,27,49,1) 100%)' }} />
            <div style={{ position: 'absolute', top: 16, right: isRTL ? 'auto' : 16, left: isRTL ? 16 : 'auto', opacity: 0.15, color: '#C9A227', fontFamily: "var(--font-display)", fontStyle: 'italic', fontSize: 13, lineHeight: 1.8, textAlign: isRTL ? 'left' : 'right' }}>
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
                    <bdi dir={/[\u0600-\u06FF]/.test(m.value) ? 'rtl' : 'ltr'} style={{ display: 'block', fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: '#FFF', lineHeight: 1.1 }}><CountUp value={m.value} /></bdi>
                    <div style={{ fontSize: 10.5, color: '#8C9BB2', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 4. BIO */}
            <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '18px 16px', borderInlineStart: '3px solid #C9A227' }}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.85, color: '#C4CFDE' }}>{displayBio}</p>
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
            RESEARCH AREAS — one solid panel on the dotted page
        ═══════════════════════════════════ */}
        <section id="research" className="paper pb-14 pt-[clamp(56px,8vw,112px)]" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="wrap">
            <div className="card reveal p-5 sm:p-8">
              <SectionHead eyebrow={t.researchAreas} title={t.frontiers} href="/research" more={isRTL ? 'كل الأبحاث' : 'All research'} isRTL={isRTL} />
              <AreaGrid areas={researchAreas.map((a) => [a.name_en || a.name_ar || '', a.name_ar || a.name_en || ''] as [string, string])} lang={isRTL ? 'ar' : 'en'} />
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════
            FEATURED PUBLICATIONS — tinted band, white cards
        ═══════════════════════════════════ */}
        <section id="publications" className="border-y border-line bg-surface-3 py-14 sm:py-16" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="wrap">
            <SectionHead eyebrow={t.recentWork} title={t.featuredPublications} href="/publications" more={t.viewAllPublications} isRTL={isRTL} />
            {publications.length === 0 ? <p className="text-[14px] text-muted">{t.noPublications}</p> : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {publications.map((pub, i) => (
                  <article key={pub.id} dir="ltr" className="pub-card reveal group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-[var(--c-shadow)] transition duration-500 hover:-translate-y-1 hover:border-[#C9A227]/50 hover:shadow-[var(--c-shadow-lg)]" style={{ ['--d' as any]: `${i * 90}ms` }}>
                    <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#C9A227] to-[#1E9BD0]" />
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-sky-soft px-2 py-0.5 font-display text-[12px] font-semibold text-link">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-[12px] text-muted">{pub.year}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold leading-snug text-ink">{pub.title_en}</h3>
                    <p className="text-[12.5px] leading-relaxed text-ink-2">{pub.authors}</p>
                    {pub.journal_name && <p className="mt-auto pt-1 text-[12.5px] italic text-gold-ink">{pub.journal_name}</p>}
                    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-2.5 text-[12px] text-muted">
                      {pub.citation_count != null && pub.citation_count > 0 && <span>{pub.citation_count} {t.citations.toLowerCase()}</span>}
                      {pub.doi && <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="ms-auto font-semibold text-link hover:underline">DOI ↗</a>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════
            TEACHING CTA
        ═══════════════════════════════════ */}
        <section className="reveal paper" dir={isRTL ? 'rtl' : 'ltr'} style={{ padding: '56px 0' }}>
          <div className="wrap"><div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: 'radial-gradient(90% 140% at 0% 0%, rgba(18,164,217,.35) 0%, transparent 55%), radial-gradient(60% 120% at 100% 100%, rgba(201,162,39,.16) 0%, transparent 60%), #0E2542', border: '1px solid rgba(201,162,39,.25)', padding: 'clamp(24px,4vw,44px)', color: '#fff', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
            <MathField variant="waves" className="absolute inset-0 h-full w-full opacity-50" density={0.6} />
            <div style={{ position: 'relative', maxWidth: 620 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#E3C566', letterSpacing: isRTL ? 0 : '0.12em', textTransform: isRTL ? 'none' : 'uppercase' }}>{isRTL ? 'للطلاب' : 'For students'}</p>
              <h2 className={isRTL ? 'ac-arabic' : 'ac-display'} style={{ margin: 0, fontSize: 'clamp(24px,3.4vw,34px)', fontWeight: 600, lineHeight: 1.2 }}>{isRTL ? 'المساقات: أوراق تفاعلية، حلول وفيديوهات' : 'Courses: interactive sheets, solutions and videos'}</h2>
              <p style={{ margin: '10px 0 0', color: '#C4CFDE', fontSize: 15, lineHeight: 1.7 }}>{isRTL ? 'سجّل ببريدك الجامعي واطلب الانضمام إلى مساقك.' : 'Register with your university email and request access to your course.'}</p>
            </div>
            <div style={{ position: 'relative', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/courses" style={{ background: '#C9A227', color: '#0A1A30', fontWeight: 600, padding: '13px 22px', borderRadius: 6, fontSize: 14.5 }}>{isRTL ? 'تصفّح المساقات' : 'Browse courses'}</Link>
              <Link href="/login" style={{ border: '1px solid rgba(255,255,255,.35)', color: '#fff', padding: '13px 22px', borderRadius: 6, fontSize: 14.5 }}>{isRTL ? 'دخول الطلاب' : 'Student login'}</Link>
            </div>
          </div></div>
        </section>

        {/* ═══════════════════════════════════
            NEWS — مشترك
        ═══════════════════════════════════ */}
        <section id="news" className="reveal" style={{ position: 'relative', background: 'radial-gradient(70% 90% at 85% 0%, rgba(18,164,217,.14) 0%, transparent 60%), linear-gradient(180deg,#0E2542 0%,#0B1C33 55%,#081527 100%)', padding: '72px 0 88px' }} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="wrap">
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#C9A227', letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase' }}>{t.newsAchievements}</p>
            <h2 className={isRTL ? 'ac-arabic' : 'ac-display'} style={{ margin: '0 0 10px', fontSize: 'clamp(22px,3.6vw,34px)', fontWeight: 600, lineHeight: 1.2, color: '#FFF' }}>{t.latestNews}</h2>
            <div className="bar2" style={{ marginBottom: 28 }} />
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