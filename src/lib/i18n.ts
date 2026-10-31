export type Lang = 'en' | 'ar'
export const LANGS: Lang[] = ['en', 'ar']
export const LANG_COOKIE = 'site-lang'

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'ar'
}

/** pick the Arabic or English field, falling back to the other one */
export function pick<T extends Record<string, any>>(obj: T | null | undefined, base: string, lang: Lang): string {
  if (!obj) return ''
  const ar = obj[`${base}_ar`]
  const en = obj[`${base}_en`]
  return (lang === 'ar' ? ar || en : en || ar) || ''
}
