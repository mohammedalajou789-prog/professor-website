import { redirect } from 'next/navigation'

/** One sign-in page for everyone: students and the admin use /login (admins are sent to the admin area). */
export default function AdminLogin() {
  redirect('/login')
}
