import MathField from '@/components/motion/MathField'
import CountUp from '@/components/motion/CountUp'

type Metric = { value: string; label: string; sym?: string }

/** Shared dark hero for inner pages — same visual language as Home/About. */
export default function PageHero({
  eyebrow,
  title,
  lede,
  metrics,
  variant = 'spiral',
  equations = [],
  children,
}: {
  eyebrow: string
  title: string
  lede?: string
  metrics?: Metric[]
  variant?: 'spiral' | 'saddle' | 'vortex' | 'waves'
  equations?: string[]
  children?: React.ReactNode
}) {
  return (
    <section className="hero-backdrop relative overflow-hidden pb-9 pt-10 sm:pb-12 sm:pt-16">
      <div className="hero-grid pointer-events-none absolute inset-0" />
      <MathField variant={variant} className="absolute inset-0 h-full w-full opacity-70" density={0.8} />
      {equations.length > 0 && (
        <div dir="ltr" aria-hidden className="pointer-events-none absolute inset-y-0 end-0 hidden w-[48%] font-display italic text-[rgba(206,222,240,.14)] md:block">
          {equations.map((eq, i) => (
            <span
              key={i}
              className="absolute whitespace-nowrap text-[clamp(13px,1.3vw,19px)]"
              style={{ top: `${10 + i * 22}%`, left: `${(i * 17) % 40}%`, animation: `float-y ${6 + i}s ease-in-out ${-i * 1.3}s infinite` }}
            >
              {eq}
            </span>
          ))}
        </div>
      )}
      <div className="relative mx-auto max-w-[1680px] px-4 sm:px-7 lg:px-12 2xl:px-[72px]">
        <p className="page-enter mb-3 text-[11.5px] font-semibold uppercase tracking-[.14em] text-[#C9A227] rtl:tracking-normal">{eyebrow}</p>
        <h1 className="page-enter mb-3 font-display text-[clamp(32px,5vw,56px)] font-semibold leading-[1.08] tracking-[-0.015em] text-white [animation-delay:80ms] rtl:font-arabic rtl:tracking-normal">
          {title}
        </h1>
        <div className="mb-5 h-[3px] w-16 origin-[left] animate-[bar-in_1s_var(--ease-out)_.25s_both] bg-[#C9A227] rtl:origin-[right]" />
        {lede && <p className="page-enter mb-7 max-w-[640px] text-[15px] leading-[1.75] text-[#AEBBCC] [animation-delay:160ms] sm:text-[16px]">{lede}</p>}
        {metrics && metrics.length > 0 && (
          <div className="page-enter grid grid-cols-2 overflow-hidden rounded-xl border border-white/[.08] bg-navy-2/80 backdrop-blur-sm [animation-delay:240ms] sm:inline-grid sm:grid-cols-4">
            {metrics.map((m, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-4 sm:px-6 ${i % 2 ? 'border-s border-white/[.07]' : ''} ${i >= 2 ? 'border-t border-white/[.07] sm:border-t-0' : ''} ${i === 2 ? 'sm:border-s' : ''}`}>
                {m.sym && (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#C9A227]/30 bg-[#C9A227]/10 font-display text-[17px] text-[#D9B45B]">{m.sym}</span>
                )}
                <div className="min-w-0">
                  <bdi dir="ltr" className="block font-display text-[24px] font-semibold leading-none text-white sm:text-[28px]">
                    <CountUp value={m.value} />
                  </bdi>
                  <span className="mt-1 block truncate text-[11.5px] text-muted sm:text-[12.5px]">{m.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
