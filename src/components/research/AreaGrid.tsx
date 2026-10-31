import AreaArt, { assignKinds } from './AreaArt'

/** Research-area cards: a dark "blackboard" drawing on a solid card (used on Home and Research). */
export default function AreaGrid({ areas, lang }: { areas: [string, string][]; lang: 'en' | 'ar' }) {
  const kinds = assignKinds(areas.map(([en]) => en))
  return (
    <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {areas.map(([en, ar], i) => (
        <article
          key={en + i}
          className="reveal group relative overflow-hidden rounded-xl border border-line bg-surface-2 p-3 transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1.5 hover:border-[#C9A227]/50 hover:shadow-[var(--c-shadow-lg)]"
          style={{ ['--d' as any]: `${(i % 4) * 100}ms` }}
        >
          <div className="art-board relative h-[128px] overflow-hidden rounded-lg p-2">
            <AreaArt kind={kinds[i]} />
          </div>
          <div className="flex items-start gap-3 px-1.5 pb-1 pt-3.5">
            <span className="shrink-0 font-display text-[14px] italic text-gold-ink">{String(i + 1).padStart(2, '0')}</span>
            <h3 className={`text-[16px] font-semibold leading-snug text-ink ${lang === 'ar' ? 'font-arabic' : ''}`}>{lang === 'ar' ? ar || en : en}</h3>
          </div>
        </article>
      ))}
    </div>
  )
}
