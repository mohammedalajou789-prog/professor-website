'use client'

import { createContext, useContext } from 'react'
import { LANG_COOKIE, type Lang } from '@/lib/i18n'

interface LangContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  isRTL: boolean
}

const LangContext = createContext<LangContextType>({ lang: 'en', setLang: () => {}, isRTL: false })

/**
 * The language comes from the server (cookie → proxy → /[lang] route), so the
 * very first HTML is already in the right language and direction. Switching
 * language stores the cookie and reloads once.
 */
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const setLang = (next: Lang) => {
    if (next === lang) return
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    window.location.reload()
  }
  return <LangContext.Provider value={{ lang, setLang, isRTL: lang === 'ar' }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
