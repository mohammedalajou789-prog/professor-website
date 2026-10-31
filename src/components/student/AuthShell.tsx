import MathField from '@/components/motion/MathField'

/** Split layout for login / register: animated math panel + form card. */
export default function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle: string; children: React.ReactNode; aside: React.ReactNode }) {
  return (
    <section className="paper relative min-h-[calc(100vh-64px)] lg:grid lg:grid-cols-[1fr_1.05fr]">
      <div className="hero-backdrop relative hidden overflow-hidden lg:block">
        <div className="hero-grid absolute inset-0" />
        <MathField variant="saddle" className="absolute inset-0 h-full w-full" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">{aside}</div>
      </div>
      <div className="flex items-start justify-center px-4 py-10 sm:py-16 lg:items-center">
        <div className="page-enter w-full max-w-[460px]">
          <h1 className="font-display text-[34px] font-semibold leading-tight text-ink rtl:font-arabic">{title}</h1>
          <p className="mb-7 mt-1.5 text-[15px] text-ink-2">{subtitle}</p>
          {children}
        </div>
      </div>
    </section>
  )
}

export const inputCls =
  'h-12 w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted focus:border-[#C9A227] focus:shadow-[0_0_0_4px_rgba(201,162,39,.12)]'
