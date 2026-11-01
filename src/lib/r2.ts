import 'server-only'
import { AwsClient } from 'aws4fetch'

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
  // aws4fetch signs the payload hash: it accepts strings and byte arrays only (a Blob throws)
  const data = body instanceof Blob ? new Uint8Array(await body.arrayBuffer()) : body
  const res = await r2().fetch(objectUrl(key), { method: 'PUT', body: data as BodyInit, headers: { 'content-type': contentType } })
  if (!res.ok) throw new Error(`R2 PUT ${key}: ${res.status} ${await res.text()}`)
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
