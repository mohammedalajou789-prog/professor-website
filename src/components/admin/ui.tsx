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
    <section className="rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(18,35,60,.04)] sm:p-6">
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
