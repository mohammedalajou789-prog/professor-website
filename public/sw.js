/* Offline support — lecture halls often have no internet.
 *
 * - Pages the visitor SAVED for offline use ("Save for offline" on a course or lecture) live in
 *   the "elajou-offline-pages" cache (written by the page itself, see SaveOffline.tsx).
 *   When the network fails (or is very slow) the saved copy is shown.
 * - The site's own files (/_next/static, fonts, images) are kept in "elajou-static-…" so saved
 *   pages work completely without internet.
 * - Everything else (login, admin, API, Supabase, YouTube) is NOT touched: it goes to the network as usual.
 */
const STATIC = 'elajou-static-v1'
const PAGES = 'elajou-offline-pages'
const OFFLINE = '/offline.html'
const DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll([OFFLINE, '/logo.svg', '/favicon.svg'])).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k.startsWith('elajou-static-') && k !== STATIC) await caches.delete(k)
      await self.clients.claim()
    })()
  )
})

const isStatic = (u) =>
  u.pathname.startsWith('/_next/static/') || u.pathname.startsWith('/images/') || /\.(woff2?|svg|png|jpe?g|ico|webp)$/.test(u.pathname)

function withTimeout(p, ms) {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout')), ms)
    p.then((v) => { clearTimeout(t); res(v) }, (e) => { clearTimeout(t); rej(e) })
  })
}

let puts = 0
async function trim(cache) {
  if (++puts % 40) return
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - 900; i++) await cache.delete(keys[i])
}

async function page(req) {
  const url = new URL(req.url)
  const cache = await caches.open(PAGES)
  const saved = (await cache.match(url.href, { ignoreVary: true })) || null
  try {
    // a saved page is shown if the network does not answer in 6 s ("Wi-Fi without internet")
    const res = await (saved ? withTimeout(fetch(req), 6000) : fetch(req))
    if (saved && res.ok && res.type === 'basic' && !res.redirected) cache.put(url.href, res.clone()).catch(() => {})
    return res
  } catch (e) {
    if (saved) return saved
    const plain = await cache.match(url.origin + url.pathname, { ignoreVary: true })
    if (plain) return plain
    return (await caches.match(OFFLINE)) || Response.error()
  }
}

async function asset(req) {
  const cache = await caches.open(STATIC)
  if (!DEV) {
    const hit = await cache.match(req)
    if (hit) return hit
  }
  try {
    const res = await fetch(req)
    if (res.ok && res.type === 'basic') { cache.put(req, res.clone()).then(() => trim(cache)).catch(() => {}) }
    return res
  } catch (e) {
    const hit = await cache.match(req)
    if (hit) return hit
    throw e
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (req.mode === 'navigate') {
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/print')) return
    e.respondWith(page(req))
    return
  }
  if (isStatic(url) && !url.searchParams.has('_rsc')) e.respondWith(asset(req))
})
