'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, LogIn, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { inputCls } from './AuthShell'

const T = {
  en: { email: 'Email', pass: 'Password', go: 'Sign in', no: 'No account yet?', reg: 'Create one', bad: 'Wrong email or password.', unconf: 'Please confirm your email first (check your inbox).' },
  ar: { email: 'البريد الإلكتروني', pass: 'كلمة المرور', go: 'تسجيل الدخول', no: 'ليس لديك حساب؟', reg: 'أنشئ حساباً', bad: 'البريد أو كلمة المرور غير صحيحة.', unconf: 'يرجى تأكيد بريدك الإلكتروني أولاً.' },
}

export default function LoginForm({ admin = false }: { admin?: boolean }) {
  const { lang } = useLang()
  const t = T[lang]
  const router = useRouter()
  const sp = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr('')
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
        if (error) {
          setErr(/confirm/i.test(error.message) ? t.unconf : t.bad)
          setBusy(false)
          return
        }
        const { data: isAdmin } = await supabase.rpc('is_admin')
        const next = sp.get('next')
        router.replace(next && next.startsWith('/') ? next : isAdmin ? '/admin/dashboard' : '/dashboard')
        router.refresh()
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{admin ? 'Email' : t.email}</span>
        <input required type="email" dir="ltr" autoComplete="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={admin ? '' : 'name@std.bau.edu.jo'} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{t.pass}</span>
        <span className="relative block">
          <input required type={show ? 'text' : 'password'} dir="ltr" autoComplete="current-password" className={inputCls + ' pe-11'} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow(!show)} className="absolute end-2 top-1/2 -translate-y-1/2 p-2 text-muted" aria-label="show password">
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </span>
      </label>
      {err && <p className="rounded-lg bg-bad-soft px-3.5 py-2.5 text-[13.5px] text-bad">{err}</p>}
      <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-navy text-[15px] font-semibold text-white transition hover:bg-[#1B3354] disabled:opacity-60">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} {t.go}
      </button>
      {!admin && (
        <p className="text-center text-[14px] text-ink-2">
          {t.no}{' '}
          <Link href="/register" className="font-semibold text-gold-ink underline-offset-4 hover:underline">
            {t.reg}
          </Link>
        </p>
      )}
    </form>
  )
}
