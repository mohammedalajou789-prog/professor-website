'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignOut({ label }: { label: string }) {
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut()
        window.location.href = '/'
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-2 text-[13px] text-[#C4CFDE] transition hover:border-[#C9A227] hover:text-white"
    >
      <LogOut size={14} /> {label}
    </button>
  )
}
