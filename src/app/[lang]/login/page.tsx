import { Suspense } from 'react'
import type { Metadata } from 'next'
import AuthShell from '@/components/student/AuthShell'
import LoginForm from '@/components/student/LoginForm'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Sign in' }

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const ar = isLang(lang) && lang === 'ar'
  return (
    <AuthShell
      title={ar ? 'تسجيل الدخول' : 'Sign in'}
      subtitle={ar ? 'للطلاب وللدكتور — صفحة دخول واحدة.' : 'One sign-in for students and the professor.'}
      aside={
        <>
          <p className="font-display text-[44px] italic leading-tight text-[#E3C566]">X′ = AX</p>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#AEBBCC]">
            {ar ? 'كل محاضرة: ورقة الطالب، الورقة المحلولة، والفيديوهات — في مكان واحد.' : 'Every lecture: the student sheet, the solved sheet and the videos — in one place.'}
          </p>
        </>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
