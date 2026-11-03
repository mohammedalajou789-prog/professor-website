'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import AreaArt, { assignKinds } from './AreaArt'

/**
 * Research-area cards: a dark "blackboard" drawing on a solid card (used on Home and Research).
 * `twoRows`: only two rows are shown (1, 2, 3 or 4 columns depending on the screen) with a
 * "View all" button that opens the rest in place.
 */
export default function AreaGrid({ areas, lang, twoRows }: { areas: [string, string][]; lang: 'en' | 'ar'; twoRows?: boolean }) {
  const [all, setAll] = useState(false)
  const kinds = assignKinds(areas.map(([en]) => en))
  const n = areas.length
  const limited = twoRows && !all
  // the button appears only where the two rows really hide something
  const btn = [n > 2 ? 'inline-flex' : 'hidden', n > 4 ? 'min-[520px]:inline-flex' : 'min-[520px]:hidden', n > 6 ? 'lg:inline-flex' : 'lg:hidden', n > 8 ? '2xl:inline-flex' : '2xl:hidden'].join(' ')
  return (
    <>
      <div className={`grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 ${limited ? 'area-2rows' : ''}`}>
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
      {twoRows && (
        <div className={`mt-6 justify-center ${btn} w-full`}>
          <button
            type="button"
            onClick={() => setAll(!all)}
            aria-expanded={all}
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-[14px] font-semibold text-link shadow-[var(--c-shadow)] transition hover:-translate-y-0.5 hover:border-[#C9A227]/60"
          >
            {all ? (lang === 'ar' ? 'عرض أقل' : 'Show less') : lang === 'ar' ? `رؤية الكل (${n})` : `View all (${n})`}
            <ChevronDown size={16} className={`transition-transform duration-300 ${all ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
          </button>
        </div>
      )}
    </>
  )
}
