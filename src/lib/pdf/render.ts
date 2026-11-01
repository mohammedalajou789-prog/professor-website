import 'server-only'
import { existsSync } from 'node:fs'
import { signPrint } from './token'

/**
 * Builds a real (vector, selectable-text) PDF of a sheet:
 * headless Chromium opens the dedicated print page — the same MN renderer, A4 print layout —
 * and prints it. On Vercel it uses @sparticuz/chromium; locally an installed Chrome/Edge.
 */
async function launch() {
  const puppeteer = await import('puppeteer-core')
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default
    chromium.setGraphicsMode = false
    return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true, defaultViewport: { width: 1000, height: 1400 } })
  }
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].filter(Boolean) as string[]
  const exe = candidates.find((p) => existsSync(p))
  if (!exe) throw new Error('No Chrome/Edge found for PDF export (set CHROME_PATH)')
  return puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'], defaultViewport: { width: 1000, height: 1400 } })
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

export async function renderSheetPdf(opts: { origin: string; key: string; mode: 'student' | 'doctor'; lang: 'en' | 'ar'; footer: string }) {
  const token = signPrint({ key: opts.key, mode: opts.mode, lang: opts.lang })
  const url = `${opts.origin}/print/sheet?t=${encodeURIComponent(token)}`
  const browser = await launch()
  try {
    const page = await browser.newPage()
    const headers: Record<string, string> = {}
    if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    if (Object.keys(headers).length) await page.setExtraHTTPHeaders(headers)
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    const logs: string[] = []
    page.on('pageerror', (e) => logs.push(String((e as Error)?.message || e)))
    // 'load' (not network-idle): in development the hot-reload connection never goes idle
    const res = await page.goto(url, { waitUntil: 'load', timeout: process.env.VERCEL ? 40_000 : 120_000 })
    if (!res || !res.ok()) throw new Error(`print page answered ${res?.status()} (${url.split('?')[0]})`)
    try {
      await page.waitForFunction('window.__mnPrintReady === true', { timeout: 30_000 })
    } catch {
      throw new Error(`print page did not finish loading${logs.length ? ': ' + logs.slice(0, 3).join(' | ') : ''}`)
    }
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font:8px Helvetica,Arial,sans-serif;color:#7d8590;padding:0 15mm;display:flex;justify-content:space-between"><span>${esc(opts.footer)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
      margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' },
    })
    return new Uint8Array(pdf)
  } finally {
    await browser.close().catch(() => {})
  }
}
