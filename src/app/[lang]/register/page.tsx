import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import AuthShell from '@/components/student/AuthShell'
import RegisterForm from '@/components/student/RegisterForm'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Create a student account' }

export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const ar = isLang(lang) && lang === 'ar'
  return (
    <AuthShell
      title={ar ? 'إنشاء حساب طالب' : 'Create your student account'}
      subtitle={ar ? 'للطلاب المسجّلين في مساقات الدكتور فقط — بالبريد الجامعي.' : "For students in Prof. El-Ajou's courses — university email only."}
      aside={
        <div className="max-w-md space-y-4">
          {(ar
            ? ['أنشئ حسابك ببريدك الجامعي ‎@std.bau.edu.jo', 'اطلب الانضمام إلى مساقك من لوحتك', 'يوافق الدكتور على طلبك شخصياً، فتُفتح المحاضرات']
            : ['Create your account with your @std.bau.edu.jo email', 'Request to join your course from your dashboard', 'The doctor approves your request personally — lectures unlock']
          ).map((s, i) => (
            <div key={i} className="flex items-start gap-3" style={{ animation: `page-in .6s var(--ease-out) ${300 + i * 160}ms both` }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9A227]/50 font-display text-[15px] italic text-[#E3C566]">{i + 1}</span>
              <p className="pt-1 text-[15px] text-[#DCE5F0]">{s}</p>
            </div>
          ))}
          <p className="flex items-center gap-2 pt-2 text-[13px] text-muted">
            <ShieldCheck size={15} className="text-[#C9A227]" />
            {ar ? 'تظهر علامة مائية برقمك الجامعي على أوراقك.' : 'Your sheets carry a watermark with your university ID.'}
          </p>
        </div>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
