'use client'

/** Tell the server to refresh cached public pages (home, about, research…). */
export function revalidateSite() {
  fetch('/api/revalidate', { method: 'POST' }).catch(() => {})
}

/**
 * Upload a file straight from the browser to Cloudflare R2 using a short-lived
 * presigned URL issued by our server (admin only).
 * Returns the stable site URL of the file (/api/file/<key>).
 */
export async function uploadToR2(file: File, folder: string, onProgress?: (p: number) => void): Promise<string> {
  const res = await fetch('/api/admin/upload-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ folder, filename: file.name, contentType: file.type || 'application/octet-stream', size: file.size }),
  })
  const j = await res.json()
  if (!res.ok) throw new Error(j.error || 'Could not get upload URL')
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', j.uploadUrl)
    xhr.setRequestHeader('content-type', file.type || 'application/octet-stream')
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total)
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status}). Check the R2 CORS settings.`)))
    xhr.onerror = () => reject(new Error('Network error during upload — check the R2 CORS settings.'))
    xhr.send(file)
  })
  return j.publicUrl ? j.publicUrl : j.key
}
