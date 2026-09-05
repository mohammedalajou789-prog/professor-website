'use client'

import { useState, useEffect } from 'react'

export function useLang() {
  const [lang, setLangState] = useState<'en' | 'ar'>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('site-lang') as 'en' | 'ar' | null
    if (saved === 'en' || saved === 'ar') setLangState(saved)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.body.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang, mounted])

  const setLang = (newLang: 'en' | 'ar') => {
    setLangState(newLang)
    localStorage.setItem('site-lang', newLang)
  }

  return { lang, setLang, isRTL: lang === 'ar', mounted }
}
