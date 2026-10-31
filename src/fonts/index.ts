import localFont from 'next/font/local'

/** Self-hosted variable fonts (no runtime request to Google → faster, works offline/in China). */
export const display = localFont({
  src: [
    { path: './eb-garamond-latin-wght-normal.woff2', weight: '400 800', style: 'normal' },
    { path: './eb-garamond-latin-wght-italic.woff2', weight: '400 800', style: 'italic' },
  ],
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

export const body = localFont({
  src: [
    { path: './source-serif-4-latin-wght-normal.woff2', weight: '200 900', style: 'normal' },
    { path: './source-serif-4-latin-wght-italic.woff2', weight: '200 900', style: 'italic' },
  ],
  variable: '--font-body',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

export const arabic = localFont({
  src: [{ path: './noto-naskh-arabic-arabic-wght-normal.woff2', weight: '400 700', style: 'normal' }],
  variable: '--font-ar',
  display: 'swap',
  fallback: ['Tahoma', 'serif'],
})

/** Times-like text face used inside the lecture sheets (matches the doctor's LaTeX sheets). */
export const sheetSerif = localFont({
  src: [
    { path: './stix-two-text-latin-wght-normal.woff2', weight: '400 700', style: 'normal' },
    { path: './stix-two-text-latin-wght-italic.woff2', weight: '400 700', style: 'italic' },
  ],
  variable: '--font-sheet',
  display: 'swap',
  preload: false,
  fallback: ['Times New Roman', 'serif'],
})
