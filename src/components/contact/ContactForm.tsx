'use client'

import { useState } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'
import { useLang } from '@/context/LangContext'

const T = {
  en: { name: 'Your name', email: 'Your email', subject: 'Subject', message: 'Message', send: 'Send message', note: 'Opens your email app with the message ready to send.', done: 'Your email app should now be open.', again: 'Write another' },
  ar: { name: 'الاسم', email: 'البريد الإلكتروني', subject: 'الموضوع', message: 'الرسالة', send: 'إرسال الرسالة', note: 'سيفتح تطبيق البريد لديك والرسالة جاهزة للإرسال.', done: 'يُفترض أن تطبيق البريد قد فُتح الآن.', again: 'رسالة أخرى' },
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="group relative block">
      <span className="mb-1.5 block text-[12.5px] font-medium text-ink-2 transition group-focus-within:text-gold-ink">{label}</span>
      {children}
    </label>
  )
}

export default function ContactForm({ to }: { to: string }) {
  const { lang } = useLang()
  const t = T[lang]
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const cls =
    'w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition focus:border-[#C9A227] focus:shadow-[0_0_0_4px_rgba(201,162,39,.12)]'

  if (sent)
    return (
      <div className="flex flex-col items-center py-14 text-center" style={{ animation: 'page-in .5s var(--ease-out) both' }}>
        <CheckCircle2 size={52} className="text-ok" />
        <p className="mt-4 text-[15px] text-ink-2">{t.done}</p>
        <button onClick={() => setSent(false)} className="mt-6 text-[13.5px] font-semibold text-gold-ink underline-offset-4 hover:underline">
          {t.again}
        </button>
      </div>
    )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const body = `${f.message}\n\n— ${f.name}\n${f.email}`
        window.location.href = `mailto:${to}?subject=${encodeURIComponent(f.subject)}&body=${encodeURIComponent(body)}`
        setTimeout(() => setSent(true), 600)
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name}>
          <input required className={cls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
        </Field>
        <Field label={t.email}>
          <input required type="email" dir="ltr" className={cls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
        </Field>
      </div>
      <Field label={t.subject}>
        <input required className={cls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
      </Field>
      <Field label={t.message}>
        <textarea required rows={6} className={`${cls} resize-y`} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[12.5px] text-muted">{t.note}</p>
        <button type="submit" className="group inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-[14.5px] font-semibold text-white transition hover:bg-[#1B3354]">
          <Send size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          {t.send}
        </button>
      </div>
    </form>
  )
}
