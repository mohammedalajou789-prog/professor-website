import { Suspense } from 'react'
import AuthShell from '@/components/student/AuthShell'
import LoginForm from '@/components/student/LoginForm'

export const metadata = { title: 'Admin sign in', robots: { index: false } }

export default function AdminLogin() {
  return (
    <AuthShell title="Admin" subtitle="Sign in to manage the website and courses." aside={<p className="font-display text-[40px] italic text-[#E3C566]">∮ admin</p>}>
      <Suspense>
        <LoginForm admin />
      </Suspense>
    </AuthShell>
  )
}
