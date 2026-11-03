import type { Metadata } from 'next'
import PageHero from '@/components/ui/PageHero'
import AreaGrid from '@/components/research/AreaGrid'
import OutputChart from '@/components/research/OutputChart'
import ResearchLibrary from '@/components/research/ResearchLibrary'
import { getInterests, getProfile, getPublications } from '@/lib/data'
import { isPublished, pubStats, type Pub } from '@/lib/pubstats'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Research' }

const FALLBACK = [
  ['Fractional Calculus', 'حساب التفاضل الكسري'],
  ['Fractional Differential Equations', 'المعادلات التفاضلية الكسرية'],
  ['Mathematical Modelling', 'النمذجة الرياضية'],
  ['Numerical Analysis', 'التحليل العددي'],
  ['Special Functions', 'الدوال الخاصة'],
  ['Fuzzy Differential Equations', 'المعادلات التفاضلية الضبابية'],
]

const T = {
  en: {
    eyebrow: 'Research',
    title: 'Exploring Mathematical Frontiers',
    lede: 'Fractional calculus, analytic and approximate solution methods for differential equations, and mathematical modelling — searchable, year by year.',
    pubs: 'Publications', cites: 'Citations', h: 'h-index', journals: 'Journals',
    areasEyebrow: 'Research areas', areasTitle: 'Where the work lives',
    timeEyebrow: 'Output', timeTitle: 'Publications per year',
    libEyebrow: 'Library', libTitle: 'All research papers',
  },
  ar: {
    eyebrow: 'الأبحاث',
    title: 'آفاق في الرياضيات التطبيقية',
    lede: 'حساب التفاضل الكسري، والطرق التحليلية والتقريبية لحل المعادلات التفاضلية، والنمذجة الرياضية — قابلة للبحث وحسب السنة.',
    pubs: 'منشور', cites: 'اقتباس', h: 'معامل h', journals: 'مجلة',
    areasEyebrow: 'مجالات البحث', areasTitle: 'محاور العمل البحثي',
    timeEyebrow: 'الإنتاج العلمي', timeTitle: 'عدد المنشورات حسب السنة',
    libEyebrow: 'المكتبة', libTitle: 'جميع الأبحاث',
  },
}

function SectionHead({ eyebrow, title, dark }: { eyebrow: string; title: string; dark?: boolean }) {
  return (
    <div className="reveal mb-8">
      <p className={`mb-2 text-[12px] font-semibold uppercase tracking-[.12em] rtl:tracking-normal ${dark ? 'text-[#E3C566]' : 'text-gold-ink'}`}>{eyebrow}</p>
      <h2 className={`font-display text-[clamp(24px,3.4vw,34px)] font-semibold leading-tight rtl:font-arabic ${dark ? 'text-white' : 'text-ink'}`}>{title}</h2>
      <div className="bar2 mt-3" />
    </div>
  )
}

export default async function ResearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params
  const lang = isLang(l) ? l : 'en'
  const t = T[lang]
  const [all, interests, profile] = await Promise.all([getPublications(), getInterests(), getProfile()])
  const pubs = (all as Pub[]).filter(isPublished)
  const s = pubStats(pubs as Pub[], profile)
  const areas = interests.length ? interests.map((a: any) => [a.name_en, a.name_ar || a.name_en]) : FALLBACK


  return (
    <>
      <PageHero
        eyebrow={t.eyebrow}
        title={t.title}
        lede={t.lede}
        variant="vortex"
        equations={['ᶜDₜᵅ u(t) = f(t, u)', 'Eα,β(z) = Σ zᵏ / Γ(αk+β)', 'u(x,t) = Σ fₙ(x) tⁿᵅ / Γ(nα+1)', 'ℒ{Dᵅu} = sᵅU(s) − …']}
        metrics={[
          { sym: '∫', value: String(s.count), label: t.pubs },
          { sym: '∞', value: String(s.citations), label: t.cites },
          { sym: 'h', value: String(s.h), label: t.h },
          { sym: 'Σ', value: String(s.journals), label: t.journals },
        ]}
      />

      {/* Areas */}
      <section id="areas" className="mx-auto max-w-[1680px] scroll-mt-20 px-4 sm:px-7 lg:px-12 2xl:px-[72px] py-10 sm:py-16">
        <div className="card p-5 sm:p-8">
          <SectionHead eyebrow={t.areasEyebrow} title={t.areasTitle} />
          <AreaGrid twoRows areas={areas as [string, string][]} lang={lang} />
        </div>
      </section>

      {/* Timeline — on a dark board so the chart pops */}
      {Object.keys(s.perYear).length > 1 && (
        <section className="board relative overflow-hidden">
          <div className="mx-auto max-w-[1680px] px-4 py-14 sm:px-7 sm:py-16 lg:px-12 2xl:px-[72px]">
            <SectionHead eyebrow={t.timeEyebrow} title={t.timeTitle} dark />
            <OutputChart perYear={s.perYear} lang={lang} />
          </div>
        </section>
      )}

      {/* Library */}
      <section className="bg-surface-3 border-t border-line">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-7 lg:px-12 2xl:px-[72px] py-12 sm:py-16">
          <SectionHead eyebrow={t.libEyebrow} title={t.libTitle} />
          <ResearchLibrary pubs={pubs as Pub[]} />
        </div>
      </section>
    </>
  )
}
