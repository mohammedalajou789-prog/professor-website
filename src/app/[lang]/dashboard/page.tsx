import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { IdCard, Mail, Phone, ShieldCheck } from 'lucide-react'
import MathField from '@/components/motion/MathField'
import CourseCard from '@/components/student/CourseCard'
import SignOut from '@/components/student/SignOut'
import { requireStudentOrAdmin } from '@/lib/auth'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'My courses', robots: { index: false } }

export default async function Dashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params
  const lang = isLang(l) ? l : 'en'
  const ar = lang === 'ar'
  const { supabase, student, isAdmin, user } = await requireStudentOrAdmin('/dashboard')
  if (isAdmin && !student) redirect('/admin/courses')

  const [{ data: courses }, { data: enr }] = await Promise.all([
    supabase.from('courses').select('*').order('sort_order'),
    student ? supabase.from('enrollments').select('course_id,status').eq('student_id', student.id) : Promise.resolve({ data: [] as any[] }),
  ])
  const st = new Map<string, string>((enr || []).map((e: any) => [e.course_id, e.status]))
  const mine = (courses || []).filter((c: any) => st.get(c.id) === 'approved')
  const pending = (courses || []).filter((c: any) => st.get(c.id) === 'pending')
  const other = (courses || []).filter((c: any) => !st.has(c.id) && c.enrollment_open)
  const first = (student?.full_name || user?.email || '').split(' ')[0]

  const Badge = ({ s }: { s: string }) => (
    <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold backdrop-blur ${s === 'approved' ? 'bg-[#0E7C6B]/80 text-white' : 'bg-[#C9A227]/90 text-[#0A1A30]'}`}>
      {s === 'approved' ? (ar ? 'مُفعّل' : 'Active') : ar ? 'بانتظار الموافقة' : 'Pending'}
    </span>
  )

  return (
    <>
      <section className="hero-backdrop relative overflow-hidden pb-10 pt-10 sm:pt-14">
        <div className="hero-grid absolute inset-0" />
        <MathField variant="spiral" className="absolute inset-0 h-full w-full opacity-60" density={0.7} />
        <div className="relative mx-auto flex max-w-[1680px] flex-wrap items-end justify-between gap-6 px-4 sm:px-7 lg:px-12 2xl:px-[72px]">
          <div>
            <p className="page-enter text-[12px] font-semibold uppercase tracking-[.14em] text-[#C9A227] rtl:tracking-normal">{ar ? 'لوحة الطالب' : 'Student dashboard'}</p>
            <h1 className="page-enter mt-2 font-display text-[clamp(30px,4.4vw,48px)] font-semibold text-white [animation-delay:80ms] rtl:font-arabic">
              {ar ? `أهلاً، ${first}` : `Welcome, ${first}`}
            </h1>
            {student && (
              <div className="page-enter mt-4 flex flex-wrap gap-2 text-[13px] text-[#C4CFDE] [animation-delay:160ms]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5"><IdCard size={14} className="text-[#E3C566]" /> <bdi dir="ltr">{student.university_id}</bdi></span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5"><Mail size={14} className="text-[#E3C566]" /> <bdi dir="ltr">{student.email}</bdi></span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5"><Phone size={14} className="text-[#E3C566]" /> <bdi dir="ltr">{student.phone}</bdi></span>
              </div>
            )}
          </div>
          <div className="page-enter flex gap-2 [animation-delay:240ms]">
            {isAdmin && <Link href="/admin/courses" className="rounded-md bg-[#C9A227] px-3 py-2 text-[13px] font-semibold text-[#0A1A30]">Admin</Link>}
            <SignOut label={ar ? 'خروج' : 'Sign out'} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1680px] space-y-12 px-4 sm:px-7 lg:px-12 2xl:px-[72px] py-10 sm:py-14">
        {student?.status === 'blocked' && (
          <p className="rounded-xl bg-bad-soft p-4 text-bad">{ar ? 'تم إيقاف حسابك. تواصل مع الدكتور.' : 'Your account is suspended. Please contact the doctor.'}</p>
        )}

        <section>
          <h2 className="reveal mb-5 font-display text-[28px] font-semibold text-ink rtl:font-arabic">{ar ? 'مساقاتي' : 'My courses'}</h2>
          {mine.length + pending.length === 0 ? (
            <div className="reveal rounded-2xl border border-dashed border-line-2 bg-surface p-8 text-center">
              <p className="font-display text-[40px] italic text-[#C9A227]">∅</p>
              <p className="mt-1 text-[15px] text-ink-2">{ar ? 'لم تنضم إلى أي مساق بعد. اختر مساقك من الأسفل واطلب الانضمام.' : 'You have not joined a course yet. Pick yours below and request access.'}</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...mine, ...pending].map((c: any, i: number) => <CourseCard key={c.id} c={c} lang={lang} i={i} badge={<Badge s={st.get(c.id)!} />} />)}
            </div>
          )}
        </section>

        {other.length > 0 && (
          <section>
            <h2 className="reveal mb-1.5 font-display text-[24px] font-semibold text-ink rtl:font-arabic">{ar ? 'مساقات متاحة' : 'Available courses'}</h2>
            <p className="reveal mb-5 flex items-center gap-1.5 text-[13.5px] text-muted"><ShieldCheck size={14} /> {ar ? 'افتح المساق واضغط «طلب الانضمام» — يوافق الدكتور شخصياً.' : 'Open a course and press “Request access” — the doctor approves personally.'}</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {other.map((c: any, i: number) => <CourseCard key={c.id} c={c} lang={lang} i={i} />)}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
