'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { useLang } from '@/context/LangContext'

/** Registers the offline service worker (public/sw.js) and shows a small note while the device is offline. */
export default function OfflineSW() {
  const { isRTL } = useLang()
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const reg = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {})
      if (document.readyState === 'complete') reg()
      else window.addEventListener('load', reg, { once: true })
    }
    const on = () => setOffline(!navigator.onLine)
    on()
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on) }
  }, [])

  if (!offline) return null
  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-[300] mx-auto flex max-w-[460px] items-center gap-3 rounded-xl border border-[#C9A227]/40 bg-[#0B1A2E] px-4 py-3 text-[13.5px] text-white shadow-2xl" style={{ animation: 'page-in .35s both' }}>
      <WifiOff size={18} className="shrink-0 text-[#E3C566]" />
      <span>{isRTL ? 'لا يوجد إنترنت — تعرض الآن النسخة المحفوظة على جهازك.' : 'No internet — you are viewing the copy saved on this device.'}</span>
    </div>
  )
}
