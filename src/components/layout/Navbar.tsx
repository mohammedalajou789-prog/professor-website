'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  name_en?: string
  name_ar?: string
  title_en?: string
  title_ar?: string
  photo_url?: string
}

export default function Navbar() {
  const { lang, setLang, isRTL } = useLang()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const pathname = usePathname()

  /* ── scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── fetch minimal profile for brand ── */
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profile')
      .select('name_en, name_ar, title_en, title_ar, photo_url')
      .single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [])

  /* ── close mobile drawer on route change ── */
  useEffect(() => { setIsOpen(false) }, [pathname])

  /* ── lock body scroll when drawer is open ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const navLinks = isRTL
    ? [
        { href: '/',             label: 'الرئيسية' },
        { href: '/about',        label: 'السيرة الأكاديمية' },
        { href: '/research',     label: 'الأبحاث' },
        { href: '/publications', label: 'المنشورات' },
        { href: '/contact',      label: 'تواصل' },
      ]
    : [
        { href: '/',             label: 'Home' },
        { href: '/about',        label: 'About' },
        { href: '/research',     label: 'Research' },
        { href: '/publications', label: 'Publications' },
        { href: '/contact',      label: 'Contact' },
      ]

  const brandName = isRTL
    ? profile?.name_ar || 'أ.د. أحمد محمد العجو'
    : profile?.name_en || 'Prof. Ahmad El-Ajou'

  const brandTitle = isRTL
    ? profile?.title_ar || 'أستاذ الرياضيات التطبيقية'
    : profile?.title_en || 'Full Professor of Mathematics'

  return (
    <>
      <style jsx global>{`
        /* ── Desktop nav links visible, hamburger hidden ── */
        @media (min-width: 769px) {
          .nav-desktop-links { display: flex !important; }
          .nav-hamburger      { display: none  !important; }
        }
        /* ── Desktop nav links hidden, hamburger visible ── */
        @media (max-width: 768px) {
          .nav-desktop-links { display: none  !important; }
          .nav-hamburger      { display: flex !important; }
        }
      `}</style>

      {/* ════════════════ NAVBAR BAR ════════════════ */}
      <nav
        dir="ltr"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 100,
          background: '#1B2A4A',
          borderBottom: scrolled
            ? '1px solid rgba(201,168,76,0.25)'
            : '1px solid rgba(255,255,255,0.07)',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.35)' : 'none',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        <div
          style={{
            maxWidth: 1220,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          {/* ── Brand ── */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '1.5px solid rgba(201,168,76,0.8)',
                  background: 'rgba(201,168,76,0.08)',
                  boxShadow: '0 0 0 2px rgba(201,168,76,0.15)',
                }}
              />
              <div
                style={{
                  position: 'absolute', bottom: -10, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 54, height: 54, borderRadius: '50%',
                  overflow: 'hidden', background: '#122B48',
                  border: '1.5px solid rgba(201,168,76,0.6)',
                  zIndex: 2,
                }}
              >
                {profile?.photo_url ? (
                  <img
                    src={profile.photo_url} alt={brandName}
                    style={{ width: '100%', height: '140%', objectFit: 'cover', objectPosition: 'top center' }}
                  />
                ) : (
                  <span
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '100%', height: '100%',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 18, color: '#C9A84C', fontStyle: 'italic',
                    }}
                  >A</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: 14, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.3,
                  fontFamily: isRTL ? "'Noto Kufi Arabic', sans-serif" : "'Playfair Display', serif",
                  direction: isRTL ? 'rtl' : 'ltr',
                }}
              >{brandName}</span>
              <span style={{ fontSize: 11.5, color: '#C9A84C', lineHeight: 1.3, direction: isRTL ? 'rtl' : 'ltr' }}>
                {brandTitle}
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="nav-desktop-links" style={{ alignItems: 'center', gap: 2 }}>
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 13.5,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#C9A84C' : '#C4CFDE',
                    padding: '20px 14px',
                    lineHeight: 1,
                    borderBottom: active ? '2px solid #C9A84C' : '2px solid transparent',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.2s, border-color 0.2s',
                    fontFamily: isRTL ? "'Noto Kufi Arabic', sans-serif" : 'inherit',
                    direction: isRTL ? 'rtl' : 'ltr',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = '#FFFFFF'
                      e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = '#C4CFDE'
                      e.currentTarget.style.borderBottomColor = 'transparent'
                    }
                  }}
                >{link.label}</Link>
              )
            })}
          </div>

          {/* ── Right side: Lang toggle + hamburger ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              style={{
                fontSize: 13, color: '#FFFFFF', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.28)', borderRadius: 4,
                padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit',
                minHeight: 36, whiteSpace: 'nowrap', transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#C9A84C'
                e.currentTarget.style.color = '#C9A84C'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'
                e.currentTarget.style.color = '#FFFFFF'
              }}
            >{lang === 'en' ? 'عربي' : 'English'}</button>

            {/* Hamburger — mobile only */}
            <button
              className="nav-hamburger"
              onClick={() => setIsOpen(true)}
              aria-label="Open menu"
              style={{
                display: 'none', /* overridden by media query */
                background: 'transparent', border: 'none',
                color: '#FFFFFF', cursor: 'pointer', padding: 6,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════ MOBILE DRAWER OVERLAY ════════════════ */}
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer panel — slides in from the right */}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          zIndex: 201,
          width: 'min(80vw, 300px)',
          background: '#0F1E35',
          borderLeft: '1px solid rgba(201,168,76,0.2)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 20px', height: 64,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: '#1B2A4A',
            flexShrink: 0,
          }}
        >
          {/* Mini profile in drawer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%',
                overflow: 'hidden', background: '#122B48', flexShrink: 0,
                border: '1.5px solid rgba(201,168,76,0.6)',
              }}
            >
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url} alt={brandName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                />
              ) : (
                <span
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: '100%',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 16, color: '#C9A84C', fontStyle: 'italic',
                  }}
                >A</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 13, fontWeight: 600, color: '#FFF',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: isRTL ? "'Noto Kufi Arabic', sans-serif" : "'Playfair Display', serif",
              }}>{brandName}</p>
              <p style={{
                margin: 0, fontSize: 10.5, color: '#C9A84C',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{brandTitle}</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, color: '#FFFFFF', cursor: 'pointer',
              padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation links */}
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  fontSize: 15,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#C9A84C' : '#C4CFDE',
                  padding: '14px 24px',
                  textDecoration: 'none',
                  borderRight: isRTL
                    ? (active ? '3px solid #C9A84C' : '3px solid transparent')
                    : 'none',
                  borderLeft: !isRTL
                    ? (active ? '3px solid #C9A84C' : '3px solid transparent')
                    : 'none',
                  background: active ? 'rgba(201,168,76,0.07)' : 'transparent',
                  transition: 'background 0.2s, color 0.2s',
                  textAlign: isRTL ? 'right' : 'left',
                  fontFamily: isRTL ? "'Noto Kufi Arabic', sans-serif" : 'inherit',
                  direction: isRTL ? 'rtl' : 'ltr',
                }}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Drawer footer — lang toggle */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            style={{
              width: '100%', fontSize: 14, fontWeight: 500,
              color: '#FFFFFF', background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.35)', borderRadius: 8,
              padding: '12px', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
          >{lang === 'en' ? '🌐 عربي' : '🌐 English'}</button>
        </div>
      </div>
    </>
  )
}