'use client'

import { useEffect, useState } from 'react'
import { CloudDownload, Check, Loader2, RefreshCw, Trash2 } from 'lucide-react'

/**
 * "Save for offline" — keeps a course (or one lecture) on this device so it opens with NO internet
 * (lecture halls). The page HTML goes to the "elajou-offline-pages" cache, the site's own files
 * (scripts, styles, fonts) to "elajou-static-v1"; public/sw.js serves them when the network is gone.
 */
const PAGES = 'elajou-offline-pages'
const STATIC = 'elajou-static-v1'
const INDEX = '/__offline/index.json'

export type OfflineLink = { url: string; title: string; n?: string | number }
type Entry = { title: string; urls: string[]; links: OfflineLink[]; savedAt: number }

async function readIndex(): Promise<Record<string, Entry>> {
  try {
    const r = await (await caches.open(PAGES)).match(INDEX)
    return r ? await r.json() : {}
  } catch {
    return {}
  }
}
async function writeIndex(idx: Record<string, Entry>) {
  const c = await caches.open(PAGES)
  await c.put(INDEX, new Response(JSON.stringify(idx), { headers: { 'content-type': 'application/json' } }))
}

const ASSET = /\/_next\/static\/[^"'\s\\)<>]+/g
const ASSET2 = /["'(\s]static\/(?:chunks|media|css)\/[^"'\s\\)<>]+/g
function assetsIn(text: string, into: Set<string>) {
  for (const m of text.match(ASSET) || []) into.add(m.replace(/&amp;/g, '&'))
  for (const m of text.match(ASSET2) || []) into.add('/_next/' + m.slice(1))
}

async function saveAll(urls: string[], onStep: (done: number, total: number) => void) {
  const pages = await caches.open(PAGES)
  const statics = await caches.open(STATIC)
  const assets = new Set<string>(['/offline.html', '/logo.svg', '/favicon.svg'])
  // files this page already uses
  for (const e of performance.getEntriesByType('resource')) {
    try {
      const u = new URL(e.name)
      if (u.origin === location.origin && (u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/images/'))) assets.add(u.pathname + u.search)
    } catch {}
  }
  const total = urls.length
  let done = 0
  let saved = 0
  for (const url of urls) {
    try {
      const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      if (r.ok && !r.redirected) {
        assetsIn(await r.clone().text(), assets)
        await pages.put(url, r)
        saved++
      }
    } catch {}
    onStep(++done, total)
  }
  // the site's files: scripts and styles may point to more files (fonts, code-split chunks)
  const seen = new Set<string>()
  for (let round = 0; round < 2; round++) {
    const next = new Set<string>()
    await Promise.all(
      [...assets].filter((a) => !seen.has(a)).map(async (a) => {
        seen.add(a)
        try {
          if (round === 0 && (await statics.match(a)) && !/\.(css|js)(\?|$)/.test(a)) return
          const r = await fetch(a, { credentials: 'same-origin' })
          if (!r.ok) return
          if (/\.(css|js)(\?|$)/.test(a)) assetsIn(await r.clone().text(), next)
          await statics.put(a, r)
        } catch {}
      })
    )
    for (const n of next) if (!seen.has(n)) assets.add(n)
  }
  try { await navigator.storage?.persist?.() } catch {}
  return saved
}

export default function SaveOffline({ id, title, urls, links, ar, tone = 'dark' }: { id: string; title: string; urls: string[]; links: OfflineLink[]; ar: boolean; tone?: 'dark' | 'light' }) {
  const [ok, setOk] = useState(false)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [prog, setProg] = useState<[number, number] | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'caches' in window && 'serviceWorker' in navigator && window.isSecureContext
    setOk(supported)
    if (supported) readIndex().then((i) => setEntry(i[id] || null))
  }, [id])

  if (!ok) return null

  const L = ar
    ? { save: 'حفظ للعرض بلا إنترنت', saving: 'جارٍ الحفظ', saved: 'محفوظ على هذا الجهاز', update: 'تحديث', remove: 'حذف', done: 'تم الحفظ — يفتح الآن بلا إنترنت.', fail: 'تعذّر الحفظ، تأكد من الاتصال وحاول مجدداً.', removed: 'حُذفت النسخة المحفوظة.' }
    : { save: 'Save for offline', saving: 'Saving', saved: 'Saved on this device', update: 'Update', remove: 'Remove', done: 'Saved — it now opens without internet.', fail: 'Could not save — check the connection and try again.', removed: 'The saved copy was removed.' }

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 5000) }

  const save = async () => {
    if (prog) return
    if (!navigator.onLine) return flash(L.fail)
    setProg([0, urls.length])
    try {
      // make sure the offline helper is installed before saving
      await navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
      const n = await saveAll(urls, (d, t) => setProg([d, t]))
      if (!n) throw new Error('nothing saved')
      const idx = await readIndex()
      idx[id] = { title, urls, links, savedAt: Date.now() }
      await writeIndex(idx)
      setEntry(idx[id])
      flash(L.done)
    } catch {
      flash(L.fail)
    }
    setProg(null)
  }

  const remove = async () => {
    const idx = await readIndex()
    const mine = new Set(idx[id]?.urls || urls)
    delete idx[id]
    // keep pages that another saved course/lecture still needs
    for (const e of Object.values(idx)) for (const u of e.urls) mine.delete(u)
    const c = await caches.open(PAGES)
    for (const u of mine) await c.delete(u)
    await writeIndex(idx)
    setEntry(null)
    flash(L.removed)
  }

  const dark = tone === 'dark'
  const base = 'inline-flex items-center gap-2 rounded-lg text-[13.5px] font-semibold transition disabled:opacity-80'
  return (
    <div className="relative inline-flex flex-wrap items-center gap-2">
      {!entry || prog ? (
        <button
          type="button"
          onClick={save}
          disabled={!!prog}
          className={`${base} px-4 py-2.5 ${dark ? 'border border-white/25 bg-white/10 text-white hover:border-[#C9A227] hover:bg-white/15' : 'border border-line bg-surface text-ink hover:border-[#C9A227]'}`}
        >
          {prog ? <Loader2 size={16} className="animate-spin" /> : <CloudDownload size={16} className={dark ? 'text-[#E3C566]' : 'text-gold-ink'} />}
          {prog ? `${L.saving} ${prog[0]}/${prog[1]}` : L.save}
        </button>
      ) : (
        <>
          <span className={`${base} px-3.5 py-2.5 ${dark ? 'bg-[#0E7C6B]/85 text-white' : 'bg-ok-soft text-ok'}`}>
            <Check size={16} /> {L.saved}
          </span>
          <button type="button" onClick={save} title={L.update} aria-label={L.update} className={`${base} h-10 w-10 justify-center ${dark ? 'border border-white/20 text-white hover:border-[#C9A227]' : 'border border-line text-ink-2 hover:border-[#C9A227]'}`}>
            <RefreshCw size={15} />
          </button>
          <button type="button" onClick={remove} title={L.remove} aria-label={L.remove} className={`${base} h-10 w-10 justify-center ${dark ? 'border border-white/20 text-white hover:border-[#F08A7E] hover:text-[#F08A7E]' : 'border border-line text-ink-2 hover:text-bad'}`}>
            <Trash2 size={15} />
          </button>
        </>
      )}
      {msg && (
        <span role="status" className="absolute start-0 top-full z-40 mt-2 w-max max-w-[300px] rounded-lg bg-[#0B1A2E] px-3 py-2 text-[12.5px] font-normal text-white shadow-lg">
          {msg}
        </span>
      )}
    </div>
  )
}
