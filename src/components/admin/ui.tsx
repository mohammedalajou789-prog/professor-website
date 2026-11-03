'use client'

import { Loader2 } from 'lucide-react'

export const inp = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[14.5px] text-ink outline-none transition focus:border-[#C9A227] focus:shadow-[0_0_0_3px_rgba(201,162,39,.12)]'

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-muted">{hint}</span>}
    </label>
  )
}

export function Btn({ children, onClick, kind = 'dark', busy, type = 'button', disabled, small }: { children: React.ReactNode; onClick?: () => void; kind?: 'dark' | 'gold' | 'ghost' | 'danger' | 'green'; busy?: boolean; type?: 'button' | 'submit'; disabled?: boolean; small?: boolean }) {
  const k = {
    dark: 'bg-navy text-white hover:bg-[#1B3354]',
    gold: 'bg-[#C9A227] text-[#0A1A30] hover:bg-[#E0BC4A]',
    ghost: 'border border-line bg-surface text-ink-2 hover:border-[#C9A227]',
    danger: 'border border-bad/30 bg-surface text-bad hover:bg-bad-soft',
    green: 'bg-[#0E7C6B] text-white hover:bg-[#0B6A5B]',
  }[kind]
  return (
    <button type={type} onClick={onClick} disabled={busy || disabled} className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition disabled:opacity-50 ${small ? 'px-2.5 py-1.5 text-[12.5px]' : 'px-4 py-2.5 text-[13.5px]'} ${k}`}>
      {busy && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center gap-2.5 text-start text-[13.5px] text-ink-2">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-[#0E7C6B]' : 'bg-[#C9D3E0]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all ${on ? 'start-[22px]' : 'start-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

export function Card({ title, children, actions }: { title?: React.ReactNode; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-[var(--c-shadow)] sm:p-6">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#C9A227] via-[#C9A227]/40 to-[#12A4D9]" />
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-[16px] font-semibold text-ink">{title}</h2>}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * Lively page header for every admin page: dark math board, a big glyph, the title in English + Arabic,
 * an optional count and the page's main buttons. Optional tabs row underneath.
 */
export function AdminHero({ icon: Icon, title, ar, sub, glyph = '∫', count, actions, children, tone = '#C9A227' }: {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  title: string
  ar?: string
  sub?: React.ReactNode
  glyph?: string
  count?: number | string
  actions?: React.ReactNode
  children?: React.ReactNode
  tone?: string
}) {
  return (
    <header className="admin-hero page-enter relative overflow-hidden rounded-2xl text-white" style={{ ['--tile' as any]: tone }}>
      <span aria-hidden className="pointer-events-none absolute -bottom-10 end-4 select-none font-display text-[150px] italic leading-none text-white/[.07] sm:text-[190px]">{glyph}</span>
      <div className="relative flex flex-wrap items-center gap-3.5 px-4 py-5 sm:px-6 sm:py-6">
        {Icon && <span className="admin-chip h-12 w-12 shrink-0"><Icon size={22} /></span>}
        <div className="min-w-0 flex-[1_1_240px]">
          <h1 className="flex flex-wrap items-baseline gap-x-2.5 font-display text-[clamp(20px,2.6vw,27px)] font-semibold leading-tight">
            {title}
            {count !== undefined && <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-display text-[14px] italic text-[#E3C566]">{count}</span>}
            {ar && <span className="font-arabic text-[15px] font-normal text-[#AEBBCC]">· {ar}</span>}
          </h1>
          {sub && <p className="mt-1 text-[13px] leading-relaxed text-[#AEBBCC]">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  )
}

/** Tabs row used inside AdminHero. */
export function HeroTabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string, React.ComponentType<{ size?: number }>?, number?][]; value: T; onChange: (v: T) => void }) {
  return (
    <nav className="no-scrollbar relative flex gap-1 overflow-x-auto border-t border-white/[.07] px-2 sm:px-4">
      {tabs.map(([id, label, Icon, badge]) => (
        <button key={id} type="button" onClick={() => onChange(id)} className={`relative flex shrink-0 items-center gap-1.5 px-3.5 py-3 text-[13.5px] transition ${value === id ? 'font-semibold text-[#E3C566]' : 'text-[#AEBBCC] hover:text-white'}`}>
          {Icon && <Icon size={15} />} {label}
          {!!badge && <span className="rounded-full bg-[#C9A227] px-1.5 text-[11px] font-bold text-[#0A1A30]">{badge}</span>}
          <span className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-gradient-to-r from-[#C9A227] to-[#12A4D9] transition-transform duration-300 ${value === id ? 'scale-x-100' : 'scale-x-0'}`} />
        </button>
      ))}
    </nav>
  )
}
