import type { Metadata } from 'next'
import PageHero from '@/components/ui/PageHero'
import Bibliography from '@/components/research/Bibliography'
import { getProfile, getPublications } from '@/lib/data'
import { pubStats, type Pub } from '@/lib/pubstats'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Publications' }

const T = {
  en: { eyebrow: 'Academic publications', title: 'Publications', lede: 'The complete bibliography — peer-reviewed journal articles ordered by year, with one-click citations and BibTeX export.', pubs: 'Publications', cites: 'Citations', h: 'h-index', i10: 'i10-index' },
  ar: { eyebrow: 'المنشورات الأكاديمية', title: 'المنشورات', lede: 'القائمة الكاملة للأبحاث المحكّمة مرتّبة حسب السنة، مع نسخ الاقتباس بنقرة وتصدير BibTeX.', pubs: 'منشور', cites: 'اقتباس', h: 'معامل h', i10: 'معامل i10' },
}

export default async function PublicationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params
  const t = T[isLang(l) ? l : 'en']
  const [pubs, profile] = await Promise.all([getPublications(), getProfile()])
  const s = pubStats(pubs as Pub[], profile)
  return (
    <>
      <PageHero
        eyebrow={t.eyebrow}
        title={t.title}
        lede={t.lede}
        variant="saddle"
        equations={['h = max{ i : cᵢ ≥ i }', 'Γ(z) = ∫₀^∞ tᶻ⁻¹ e⁻ᵗ dt', 'X(t) = Φ(t)C + Xₚ(t)']}
        metrics={[
          { sym: '∫', value: String(s.count), label: t.pubs },
          { sym: '∞', value: String(s.citations), label: t.cites },
          { sym: 'h', value: String(s.h), label: t.h },
          { sym: '10', value: String(s.i10), label: t.i10 },
        ]}
      />
      <Bibliography pubs={pubs as Pub[]} />
    </>
  )
}
