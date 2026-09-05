'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Lang = 'en' | 'ar'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  isRTL: boolean
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  isRTL: false,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const [mounted, setMounted] = useState(false)

  // قراءة اللغة من localStorage عند أول تحميل
  useEffect(() => {
    const saved = localStorage.getItem('site-lang') as Lang | null
    if (saved === 'en' || saved === 'ar') {
      setLangState(saved)
    }
    setMounted(true)
  }, [])

  // تحديث dir و lang على document عند تغيير اللغة
  useEffect(() => {
    if (!mounted) return
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang, mounted])

  const setLang = (newLang: Lang) => {
    setLangState(newLang)
    localStorage.setItem('site-lang', newLang)
  }

  // نمنع عرض أي شيء حتى يُقرأ localStorage لتجنب الوميض
  if (!mounted) return null

  return (
    <LangContext.Provider value={{ lang, setLang, isRTL: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
