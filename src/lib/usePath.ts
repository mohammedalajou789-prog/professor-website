'use client'
import { usePathname } from 'next/navigation'

/** Visible pathname without the internal /en or /ar prefix added by the proxy rewrite. */
export function useCleanPath() {
  const p = usePathname() || '/'
  const m = p.match(/^\/(en|ar)(\/.*)?$/)
  return m ? m[2] || '/' : p
}
