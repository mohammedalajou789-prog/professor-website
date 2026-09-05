'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  name_en?: string; name_ar?: string
  title_en?: string; title_ar?: string
  email?: string; phone?: string
  google_scholar_url?: string; orcid_url?: string
  researchgate_url?: string; linkedin_url?: string
}

export default function Footer() {
  const { lang, isRTL } = useLang()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profile')
      .select('name_en,name_ar,title_en,title_ar,email,phone,google_scholar_url,orcid_url,researchgate_url,linkedin_url')
      .single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [])

  const name  = isRTL ? profile?.name_ar  || 'أ.د. أحمد محمد العجو'        : profile?.name_en  || 'Prof. Ahmad El-Ajou'
  const title = isRTL ? profile?.title_ar || 'أستاذ الرياضيات التطبيقية'   : profile?.title_en || 'Full Professor of Mathematics'
  const email = profile?.email || 'ajou44@bau.edu.jo'
  const phone = profile?.phone || '+962 79 571 2269'

  const navLinks = isRTL
    ? [
        { href: '/about',        label: 'السيرة'     },
        { href: '/research',     label: 'الأبحاث'   },
        { href: '/publications', label: 'المنشورات' },
        { href: '/contact',      label: 'تواصل'     },
      ]
    : [
        { href: '/about',        label: 'About'        },
        { href: '/research',     label: 'Research'     },
        { href: '/publications', label: 'Publications' },
        { href: '/contact',      label: 'Contact'      },
      ]

  const socialLinks = [
    { label: 'Scholar',      mark: 'GS', href: profile?.google_scholar_url || 'https://scholar.google.com/citations?user=j2NXhIQAAAAJ&hl=en' },
    { label: 'ORCID',        mark: 'iD', href: profile?.orcid_url          || 'https://orcid.org/0000-0002-7470-8162' },
    { label: 'ResearchGate', mark: 'RG', href: profile?.researchgate_url   || 'https://www.researchgate.net/profile/Ahmad-El-Ajou' },
    { label: 'LinkedIn',     mark: 'in', href: profile?.linkedin_url        || 'https://jo.linkedin.com/in/ahmad-el-ajou-84983974' },
  ]

  const year = new Date().getFullYear()

  return (
    <>
      <style jsx global>{`
        .f-desktop { display: block; }
        .f-mobile  { display: none;  }
        @media (max-width: 768px) {
          .f-desktop { display: none;  }
          .f-mobile  { display: block; }
        }
      `}</style>

      <footer dir={isRTL ? 'rtl' : 'ltr'} style={{ background: '#081527', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* ══ DESKTOP (≥ 769px) — 3 columns ══ */}
        <div className="f-desktop">
          <div style={{ maxWidth: 1220, margin: '0 auto', padding: '56px 26px 40px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '36px 48px' }}>

            {/* Col 1 */}
            <div>
              <div style={{ width: 36, height: 2, background: '#C9A84C', marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#FFF', lineHeight: 1.35, marginBottom: 4, fontFamily: isRTL ? "'Noto Kufi Arabic',sans-serif" : "'Playfair Display',serif" }}>{name}</div>
              <div style={{ fontSize: 12.5, color: '#C9A84C', lineHeight: 1.5, marginBottom: 20 }}>{title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#8C9BB2' }}>
                  <MapPin size={13} style={{ color: '#C9A84C', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.6 }}>{isRTL ? 'جامعة البلقاء التطبيقية — قسم الرياضيات، السلط، الأردن' : 'Al-Balqa Applied University — Dept. of Mathematics, Al-Salt, Jordan'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: '#8C9BB2' }}>
                  <Mail size={13} style={{ color: '#C9A84C', flexShrink: 0 }} />
                  <a href={'mailto:' + email} dir="ltr" style={{ color: '#8C9BB2', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color='#C9A84C')} onMouseLeave={e => (e.currentTarget.style.color='#8C9BB2')}>{email}</a>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: '#8C9BB2' }}>
                  <Phone size={13} style={{ color: '#C9A84C', flexShrink: 0 }} />
                  <bdi dir="ltr">{phone}</bdi>
                </div>
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <div style={{ width: 36, height: 2, background: '#C9A84C', marginBottom: 16 }} />
              <h4 style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 600, color: '#FFF', letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase', fontFamily: isRTL ? "'Noto Kufi Arabic',sans-serif" : 'inherit' }}>{isRTL ? 'روابط سريعة' : 'Quick Links'}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {navLinks.map(l => (
                  <Link key={l.href} href={l.href} style={{ fontSize: 13, color: '#8C9BB2', textDecoration: 'none', transition: 'color 0.2s', fontFamily: isRTL ? "'Noto Kufi Arabic',sans-serif" : 'inherit' }} onMouseEnter={e => (e.currentTarget.style.color='#C9A84C')} onMouseLeave={e => (e.currentTarget.style.color='#8C9BB2')}>{l.label}</Link>
                ))}
              </div>
            </div>

            {/* Col 3 */}
            <div>
              <div style={{ width: 36, height: 2, background: '#C9A84C', marginBottom: 16 }} />
              <h4 style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 600, color: '#FFF', letterSpacing: isRTL ? 0 : '0.1em', textTransform: isRTL ? 'none' : 'uppercase', fontFamily: isRTL ? "'Noto Kufi Arabic',sans-serif" : 'inherit' }}>{isRTL ? 'الملفات الأكاديمية' : 'Academic Profiles'}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {socialLinks.map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#8C9BB2', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color='#C9A84C')} onMouseLeave={e => (e.currentTarget.style.color='#8C9BB2')}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: '1px solid rgba(201,168,76,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8.5, color: '#C9A84C', fontWeight: 700 }}>{s.mark}</span>
                    {s.label}
                    <ArrowUpRight size={11} style={{ color: '#C9A84C', opacity: 0.6, marginInlineStart: 'auto' }} />
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ══ MOBILE (≤ 768px) — قسم واحد مضغوط ══ */}
        <div className="f-mobile">
          <div style={{ padding: '22px 20px 18px' }} dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Name + title */}
            <div style={{ fontSize: 14.5, fontWeight: 600, color: '#FFF', marginBottom: 2, fontFamily: isRTL ? "'Noto Kufi Arabic',sans-serif" : "'Playfair Display',serif" }}>{name}</div>
            <div style={{ fontSize: 11.5, color: '#C9A84C', marginBottom: 16 }}>{title}</div>

            {/* Contact: email + location in one compact row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: 16 }}>
              <a href={'mailto:' + email} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#8C9BB2', textDecoration: 'none' }}>
                <Mail size={11} style={{ color: '#C9A84C', flexShrink: 0 }} />{email}
              </a>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#8C9BB2' }}>
                <MapPin size={11} style={{ color: '#C9A84C', flexShrink: 0 }} />
                {isRTL ? 'البلقاء التطبيقية، السلط' : 'BAU, Al-Salt, Jordan'}
              </span>
            </div>

            {/* Nav — pill chips in one row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 16 }}>
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} style={{ fontSize: 11.5, color: '#AEBBCC', textDecoration: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 13px', whiteSpace: 'nowrap', fontFamily: isRTL ? "'Noto Kufi Arabic',sans-serif" : 'inherit' }}>{l.label}</Link>
              ))}
            </div>

            {/* Social — icon badges in a single row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#8C9BB2', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, padding: '6px 11px' }}>
                  <span style={{ width: 17, height: 17, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#C9A84C', fontWeight: 700, flexShrink: 0 }}>{s.mark}</span>
                  {s.label}
                </a>
              ))}
            </div>

          </div>
        </div>

        {/* ══ Bottom bar — shared ══ */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ maxWidth: 1220, margin: '0 auto', padding: '12px 20px', display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: '#52627A' }} dir={isRTL ? 'rtl' : 'ltr'}>
            <span>{isRTL ? `© ${year} أ.د. أحمد العجو. جميع الحقوق محفوظة.` : `© ${year} Prof. Ahmad El-Ajou. All rights reserved.`}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span>{isRTL ? 'صُمِّم بشغف ♥ للرياضيات' : 'Made with ♥ for mathematics'}</span>
              <Link href="/admin/login" style={{ color: '#3A4A60', textDecoration: 'none', fontSize: 11 }} onMouseEnter={e => (e.currentTarget.style.color='#8C9BB2')} onMouseLeave={e => (e.currentTarget.style.color='#3A4A60')}>Admin</Link>
            </div>
          </div>
        </div>

      </footer>
    </>
  )
}