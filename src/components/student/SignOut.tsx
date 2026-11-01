'use client'

import { LogOut } from 'lucide-react'
import { signOutAll } from '@/lib/role'

export default function SignOut({ label }: { label: string }) {
  return (
    <button
      onClick={() => signOutAll('/')}
      className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-2 text-[13px] text-[#C4CFDE] transition hover:border-[#C9A227] hover:text-white"
    >
      <LogOut size={14} /> {label}
    </button>
  )
}
