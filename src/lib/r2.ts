import 'server-only'
import { AwsClient } from 'aws4fetch'
import { request as httpsRequest } from 'node:https'

/**
 * Cloudflare R2 (S3-compatible) — one PRIVATE bucket.
 *   public/...   → CV, news images (served to anyone through /api/file/...)
 *   courses/...  → sheets (.mn), PDFs (served only after an access check)
 *   wm/...       → per-student watermarked PDF copies (generated on demand)
 */
const accountId = process.env.R2_ACCOUNT_ID
const bucket = process.env.R2_BUCKET

let client: AwsClient | null = null
function r2() {
  if (!accountId || !bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 is not configured (R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)')
  }
  client ||= new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    service: 's3',
    region: 'auto',
  })
  return client
}

export const r2Configured = () => !!(accountId && bucket && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)

const enc = (key: string) => key.split('/').map(encodeURIComponent).join('/')
const objectUrl = (key: string) => `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${enc(key)}`

export async function presign(key: string, method: 'GET' | 'PUT', expiresSec = 300, opts: { filename?: string; inline?: boolean } = {}) {
  const url = new URL(objectUrl(key))
  url.searchParams.set('X-Amz-Expires', String(expiresSec))
  if (method === 'GET' && opts.filename) {
    const disp = `${opts.inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(opts.filename)}`
    url.searchParams.set('response-content-disposition', disp)
  }
  const signed = await r2().sign(new Request(url, { method }), { aws: { signQuery: true } })
  return signed.url
}

export async function getText(key: string): Promise<string | null> {
  const res = await r2().fetch(objectUrl(key))
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 GET ${key}: ${res.status}`)
  return res.text()
}

export async function getBytes(key: string): Promise<Uint8Array | null> {
  const res = await r2().fetch(objectUrl(key))
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`R2 GET ${key}: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

export async function exists(key: string) {
  const res = await r2().fetch(objectUrl(key), { method: 'HEAD' })
  return res.ok
}

export async function put(key: string, body: string | Uint8Array | ArrayBuffer | Blob, contentType: string) {
  // R2 needs a Content-Length header. aws4fetch's own fetch() re-wraps the body as a stream
  // (sent without a length → "411 MissingContentLength"), so: sign with aws4fetch, then send the raw bytes ourselves.
  const bytes =
    typeof body === 'string' ? new TextEncoder().encode(body)
    : body instanceof Blob ? new Uint8Array(await body.arrayBuffer())
    : body instanceof ArrayBuffer ? new Uint8Array(body)
    : body
  const signed = await r2().sign(objectUrl(key), { method: 'PUT', body: bytes as BodyInit, headers: { 'content-type': contentType, 'content-length': String(bytes.byteLength) } })
  const headers: Record<string, string> = {}
  signed.headers.forEach((v, k) => { headers[k] = v })
  headers['content-length'] = String(bytes.byteLength)
  // plain node:https → the length is always sent, whatever the Node/undici version (Node 26 streams fetch bodies)
  const { status, text } = await new Promise<{ status: number; text: string }>((resolve, reject) => {
    const u = new URL(signed.url)
    const req = httpsRequest({ method: 'PUT', hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, headers }, (res) => {
      let t = ''
      res.setEncoding('utf8')
      res.on('data', (c) => { t += c })
      res.on('end', () => resolve({ status: res.statusCode || 0, text: t }))
    })
    req.on('error', reject)
    req.setTimeout(60_000, () => req.destroy(new Error('R2 PUT timeout')))
    req.end(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength))
  })
  if (status < 200 || status >= 300) throw new Error(`R2 PUT ${key}: ${status} ${text.slice(0, 300)}`)
}

export async function remove(key: string) {
  await r2().fetch(objectUrl(key), { method: 'DELETE' })
}

/** make a safe object key segment from a filename */
export function safeName(name: string) {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize('NFKD').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(0, 60) || 'file'
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  return ext ? `${base}.${ext}` : base
}
