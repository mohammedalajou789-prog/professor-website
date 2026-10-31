import { Suspense } from 'react'
import AdminShell from '@/components/admin/AdminShell'

export const metadata = { robots: { index: false } }

/** Every /admin page shares the admin frame (sign-in page excepted). Access is checked per page. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  )
}
