import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { display, body, arabic, sheetSerif } from '@/fonts'
import '../globals.css'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { LangProvider } from '@/context/LangContext'
import MotionRoot from '@/components/motion/MotionRoot'
import { getProfile } from '@/lib/data'
import { LANGS, isLang, type Lang } from '@/lib/i18n'

export const dynamicParams = false
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ahmadelajou.com'),
  title: { default: 'Prof. Ahmad El-Ajou | Applied Mathematics', template: '%s | Prof. Ahmad El-Ajou' },
  description:
    'Academic website of Prof. Ahmad El-Ajou, Full Professor of Mathematics at Al-Balqa Applied University, Jordan — fractional calculus, differential equations and mathematical modelling.',
  openGraph: { type: 'website', images: ['/images/prof-portrait.jpg'] },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: '48x48' }, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
}

/** runs before paint: applies the saved theme (no flash of the wrong colours) */
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light')t='light';document.documentElement.dataset.theme=t}catch(e){}`

export const viewport: Viewport = { themeColor: '#0A1B31', width: 'device-width', initialScale: 1 }

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const profile = await getProfile()
  const brand = {
    name_en: profile?.name_en || 'Prof. Ahmad El-Ajou',
    name_ar: profile?.name_ar || 'أ.د. أحمد العجو',
    title_en: profile?.title_en || 'Full Professor of Mathematics',
    title_ar: profile?.title_ar || 'أستاذ الرياضيات التطبيقية',
    email: profile?.email || 'ajou44@bau.edu.jo',
    phone: profile?.phone || '+962 79 571 2269',
    google_scholar_url: profile?.google_scholar_url || 'https://scholar.google.com/citations?user=j2NXhIQAAAAJ&hl=en',
    orcid_url: profile?.orcid_url || 'https://orcid.org/0000-0002-7470-8162',
    researchgate_url: profile?.researchgate_url || 'https://www.researchgate.net/profile/Ahmad-El-Ajou',
    linkedin_url: profile?.linkedin_url || 'https://jo.linkedin.com/in/ahmad-el-ajou-84983974',
  }

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} data-scroll-behavior="smooth" suppressHydrationWarning className={`${display.variable} ${body.variable} ${arabic.variable} ${sheetSerif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <LangProvider lang={lang}>
          <Navbar brand={brand} />
          <main id="main">{children}</main>
          <Footer brand={brand} />
          <MotionRoot />
        </LangProvider>
      </body>
    </html>
  )
}
