'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'

export default function EnrollButton({ courseId, status, studentId }: { courseId: string; status: string | null; studentId: string }) {
  const { lang } = useLang()
  const ar = lang === 'ar'
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  if (status === 'pending')
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-lg bg-gold-soft px-4 py-2.5 text-[14px] font-medium text-gold-ink">
          <Clock size={16} className="animate-[spin-slow_6s_linear_infinite]" /> {ar ? 'طلبك بانتظار موافقة الدكتور' : 'Waiting for the doctor’s approval'}
        </span>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await createClient().from('enrollments').delete().eq('course_id', courseId).eq('student_id', studentId)
            router.refresh()
          }}
          className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-bad"
        >
          <X size={14} /> {ar ? 'إلغاء الطلب' : 'Cancel request'}
        </button>
      </div>
    )
  if (status === 'rejected')
    return <p className="rounded-lg bg-bad-soft px-4 py-2.5 text-[14px] text-bad">{ar ? 'لم تتم الموافقة على طلبك. تواصل مع الدكتور إن كان هناك خطأ.' : 'Your request was not approved. Contact the doctor if this is a mistake.'}</p>

  return (
    <div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setErr('')
          const { error } = await createClient().from('enrollments').insert({ course_id: courseId, student_id: studentId })
          if (error) {
            setErr(error.message)
            setBusy(false)
            return
          }
          router.refresh()
        }}
        className="group inline-flex items-center gap-2 rounded-lg bg-[#C9A227] px-5 py-3 text-[15px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A] disabled:opacity-60"
      >
        {busy ? <Loader2 size={17} className="animate-spin" /> : <Send size={16} className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100" />}
        {ar ? 'طلب الانضمام للمساق' : 'Request access'}
      </button>
      {err && <p className="mt-2 text-[13px] text-bad">{err}</p>}
    </div>
  )
}
