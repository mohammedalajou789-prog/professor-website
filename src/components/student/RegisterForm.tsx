'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/context/LangContext'
import { inputCls } from './AuthShell'

const T = {
  en: {
    name: 'Full name (as in university records)', uid: 'University ID number', email: 'University email', phone: 'Phone number', pass: 'Password (8+ characters)', pass2: 'Confirm password',
    go: 'Create account', have: 'Already registered?', login: 'Sign in',
    eDomain: 'Use your university email ending with @std.bau.edu.jo', eUid: 'University ID: digits only (4–20).', ePhone: 'Enter a valid phone number, e.g. 0791234567', ePass: 'Password must be at least 8 characters.', eMatch: 'Passwords do not match.',
    eTaken: 'This university ID is already registered. Sign in instead, or contact the doctor.', eGeneric: 'Could not create the account: ',
    checkTitle: 'Check your inbox', checkBody: 'We sent a confirmation link to your university email. Open it, then sign in.',
  },
  ar: {
    name: 'الاسم الكامل (كما في سجلات الجامعة)', uid: 'الرقم الجامعي', email: 'البريد الجامعي', phone: 'رقم الهاتف', pass: 'كلمة المرور (8 أحرف على الأقل)', pass2: 'تأكيد كلمة المرور',
    go: 'إنشاء الحساب', have: 'لديك حساب؟', login: 'تسجيل الدخول',
    eDomain: 'استخدم بريدك الجامعي المنتهي بـ ‎@std.bau.edu.jo', eUid: 'الرقم الجامعي: أرقام فقط (4–20).', ePhone: 'أدخل رقم هاتف صحيحاً، مثل 0791234567', ePass: 'كلمة المرور 8 أحرف على الأقل.', eMatch: 'كلمتا المرور غير متطابقتين.',
    eTaken: 'هذا الرقم الجامعي مسجّل مسبقاً. سجّل الدخول أو تواصل مع الدكتور.', eGeneric: 'تعذّر إنشاء الحساب: ',
    checkTitle: 'تحقق من بريدك', checkBody: 'أرسلنا رابط تأكيد إلى بريدك الجامعي. افتحه ثم سجّل الدخول.',
  },
}

export default function RegisterForm() {
  const { lang } = useLang()
  const t = T[lang]
  const router = useRouter()
  const [f, setF] = useState({ full_name: '', university_id: '', email: '', phone: '', password: '', password2: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  if (sent)
    return (
      <div className="rounded-2xl border border-ok/30 bg-surface p-7 text-center" style={{ animation: 'page-in .5s both' }}>
        <MailCheck size={46} className="mx-auto text-ok" />
        <h2 className="mt-3 text-[20px] font-semibold text-ink">{t.checkTitle}</h2>
        <p className="mt-1.5 text-[14.5px] text-ink-2">{t.checkBody}</p>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-navy px-5 py-2.5 text-[14px] font-semibold text-white">{t.login}</Link>
      </div>
    )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    const email = f.email.trim().toLowerCase()
    const uid = f.university_id.trim()
    const phone = f.phone.replace(/[^\d+]/g, '')
    if (!/@std\.bau\.edu\.jo$/.test(email)) return setErr(t.eDomain)
    if (!/^[0-9A-Za-z-]{4,20}$/.test(uid)) return setErr(t.eUid)
    if (!/^\+?[0-9]{9,15}$/.test(phone)) return setErr(t.ePhone)
    if (f.password.length < 8) return setErr(t.ePass)
    if (f.password !== f.password2) return setErr(t.eMatch)
    setBusy(true)
    const supabase = createClient()
    const { data: taken } = await supabase.rpc('student_id_taken', { uid })
    if (taken) {
      setBusy(false)
      return setErr(t.eTaken)
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: f.password,
      options: { data: { full_name: f.full_name.trim(), university_id: uid, phone }, emailRedirectTo: `${window.location.origin}/login` },
    })
    setBusy(false)
    if (error) {
      if (/ONLY_STD_EMAIL/.test(error.message)) return setErr(t.eDomain)
      return setErr(t.eGeneric + error.message)
    }
    if (data.session) {
      router.replace('/dashboard')
      router.refresh()
    } else setSent(true)
  }

  const field = (k: keyof typeof f, label: string, type = 'text', extra: Record<string, any> = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      <input required type={type} className={inputCls} value={f[k]} onChange={set(k)} {...extra} />
    </label>
  )

  return (
    <form onSubmit={submit} className="space-y-3.5">
      {field('full_name', t.name, 'text', { autoComplete: 'name', minLength: 3 })}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {field('university_id', t.uid, 'text', { inputMode: 'numeric', dir: 'ltr', placeholder: '3202xxxxxxx' })}
        {field('phone', t.phone, 'tel', { dir: 'ltr', autoComplete: 'tel', placeholder: '07xxxxxxxx' })}
      </div>
      {field('email', t.email, 'email', { dir: 'ltr', autoComplete: 'email', placeholder: 'name@std.bau.edu.jo' })}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {field('password', t.pass, 'password', { dir: 'ltr', autoComplete: 'new-password', minLength: 8 })}
        {field('password2', t.pass2, 'password', { dir: 'ltr', autoComplete: 'new-password' })}
      </div>
      {err && <p className="rounded-lg bg-bad-soft px-3.5 py-2.5 text-[13.5px] text-bad">{err}</p>}
      <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#C9A227] text-[15px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A] disabled:opacity-60">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />} {t.go}
      </button>
      <p className="text-center text-[14px] text-ink-2">
        {t.have}{' '}
        <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">{t.login}</Link>
      </p>
    </form>
  )
}
