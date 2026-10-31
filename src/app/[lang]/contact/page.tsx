import type { Metadata } from 'next'
import { Mail, Phone, MapPin, Clock, ArrowUpRight } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'
import ContactForm from '@/components/contact/ContactForm'
import { getProfile } from '@/lib/data'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Contact' }

const T = {
  en: {
    eyebrow: 'Contact', title: 'Get in touch', lede: 'Questions about research collaboration, supervision, or courses — the quickest route is email.',
    email: 'Email', phone: 'Phone', office: 'Office', hours: 'Office hours', where: 'Location',
    addr: 'Department of Mathematics, Al-Balqa Applied University, Al-Salt, Jordan', map: 'Open in Maps',
    profiles: 'Academic profiles', form: 'Send a message', formSub: 'Write your message and it opens in your email app.',
  },
  ar: {
    eyebrow: 'تواصل', title: 'تواصل معي', lede: 'للاستفسار عن التعاون البحثي أو الإشراف أو المساقات — أسرع طريق هو البريد الإلكتروني.',
    email: 'البريد الإلكتروني', phone: 'الهاتف', office: 'المكتب', hours: 'الساعات المكتبية', where: 'الموقع',
    addr: 'قسم الرياضيات، جامعة البلقاء التطبيقية، السلط، الأردن', map: 'فتح في الخرائط',
    profiles: 'الملفات الأكاديمية', form: 'أرسل رسالة', formSub: 'اكتب رسالتك وستُفتح في تطبيق البريد لديك.',
  },
}

/** r = cos(kθ) polar rose, drawn as an animated SVG path */
function Rose() {
  const k = 5 / 3
  let d = ''
  for (let i = 0; i <= 1080; i++) {
    const th = (i / 1080) * 6 * Math.PI
    const r = Math.cos(k * th) * 46
    d += `${i ? 'L' : 'M'}${(60 + r * Math.cos(th)).toFixed(2)} ${(60 + r * Math.sin(th)).toFixed(2)}`
  }
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden>
      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(201,162,39,.25)" strokeWidth=".4" />
      <path d={d} fill="none" stroke="#C9A227" strokeWidth=".7" className="draw-path" pathLength={1} style={{ ['--len' as any]: 1, animationDuration: '5s' }} />
    </svg>
  )
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params
  const lang = isLang(l) ? l : 'en'
  const t = T[lang]
  const p = await getProfile()
  const email = p?.email || 'ajou44@bau.edu.jo'
  const phone = p?.phone || '+962 79 571 2269'
  const cards = [
    { icon: Mail, label: t.email, value: email, href: `mailto:${email}`, ltr: true },
    { icon: Phone, label: t.phone, value: phone, href: `tel:${phone.replace(/\s/g, '')}`, ltr: true },
    p?.office && { icon: MapPin, label: t.office, value: p.office },
    p?.office_hours && { icon: Clock, label: t.hours, value: p.office_hours },
  ].filter(Boolean) as { icon: any; label: string; value: string; href?: string; ltr?: boolean }[]
  const profiles = [
    ['Google Scholar', 'GS', p?.google_scholar_url || 'https://scholar.google.com/citations?user=j2NXhIQAAAAJ&hl=en'],
    ['ORCID', 'iD', p?.orcid_url || 'https://orcid.org/0000-0002-7470-8162'],
    ['ResearchGate', 'RG', p?.researchgate_url || 'https://www.researchgate.net/profile/Ahmad-El-Ajou'],
    ['LinkedIn', 'in', p?.linkedin_url || 'https://jo.linkedin.com/in/ahmad-el-ajou-84983974'],
  ]

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} lede={t.lede} variant="waves" equations={['∮_C f(z) dz = 2πi Σ Res', 'r = cos(5θ/3)', '∇·E = ρ/ε₀']} />

      <section className="mx-auto grid max-w-[1680px] gap-6 px-4 sm:px-7 lg:px-12 2xl:px-[72px] py-12 sm:py-16 lg:grid-cols-[1fr_1.35fr]">
        <div className="space-y-4">
          <div className="grid gap-3 min-[520px]:grid-cols-2 lg:grid-cols-1">
            {cards.map((c, i) => (
              <a
                key={c.label}
                href={c.href}
                className="reveal group flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-0.5 hover:border-[#C9A227]/50 hover:shadow-[0_14px_34px_rgba(18,35,60,.09)]"
                style={{ ['--d' as any]: `${i * 90}ms` }}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy text-[#E3C566] transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
                  <c.icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12px] text-muted">{c.label}</span>
                  <span dir={c.ltr ? 'ltr' : undefined} className="block break-words text-[15px] font-medium text-ink">{c.value}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="reveal relative overflow-hidden rounded-xl bg-navy-2 p-5 text-white">
            <div className="absolute -end-6 -top-6 h-40 w-40 opacity-80">
              <Rose />
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-[#C9A227] rtl:tracking-normal">{t.where}</p>
            <p className="relative mt-2 max-w-[75%] text-[14.5px] leading-relaxed text-[#C4CFDE]">{t.addr}</p>
            <a
              href="https://maps.google.com/?q=Al-Balqa+Applied+University+Al-Salt+Jordan"
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#C9A227] px-3.5 py-2 text-[13px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A]"
            >
              {t.map} <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="reveal rounded-xl border border-line bg-surface p-5">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[.12em] text-muted rtl:tracking-normal">{t.profiles}</p>
            <div className="grid grid-cols-2 gap-2">
              {profiles.map(([label, mark, href]) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-[13px] text-ink-2 transition hover:border-[#C9A227]/50 hover:text-ink">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C9A227]/12 text-[10px] font-bold text-gold-ink">{mark}</span>
                  <span className="truncate">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="reveal rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(18,35,60,.04)] sm:p-8" style={{ ['--d' as any]: '120ms' }}>
          <h2 className="font-display text-[28px] font-semibold text-ink rtl:font-arabic">{t.form}</h2>
          <p className="mb-6 mt-1 text-[14px] text-muted">{t.formSub}</p>
          <ContactForm to={email} />
        </div>
      </section>
    </>
  )
}
