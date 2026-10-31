import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Lock, FileText, Megaphone, PlayCircle, FileCheck2, BookOpen } from 'lucide-react'
import FileRow from '@/components/student/FileRow'
import MathField from '@/components/motion/MathField'
import EnrollButton from '@/components/student/EnrollButton'
import { getCourseForViewer, type CourseFile, type Lecture } from '@/lib/courses'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Course', robots: { index: false } }

export default async function CoursePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: l, slug } = await params
  const lang = isLang(l) ? l : 'en'
  const ar = lang === 'ar'
  const { course, status, access, student, isAdmin, supabase, user } = await getCourseForViewer(slug)
  if (!course) notFound()
  const name = ar ? course.name_ar || course.name_en : course.name_en
  const desc = ar ? course.description_ar || course.description_en : course.description_en
  const syllabus = ar ? course.syllabus_ar || course.syllabus_en : course.syllabus_en

  let lectures: (Lecture & { videos: number })[] = []
  let files: CourseFile[] = []
  let news: any[] = []
  if (access) {
    let lq = supabase.from('lectures').select('*').eq('course_id', course.id).order('number')
    if (!isAdmin) lq = lq.eq('is_published', true)
    const [L, F, N] = await Promise.all([
      lq,
      supabase.from('course_files').select('*').eq('course_id', course.id).is('lecture_id', null).order('sort_order').order('created_at'),
      supabase.from('course_announcements').select('*').eq('course_id', course.id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(10),
    ])
    const ids = (L.data || []).map((x: Lecture) => x.id)
    const V = ids.length ? await supabase.from('lecture_videos').select('lecture_id').in('lecture_id', ids) : { data: [] as { lecture_id: string }[] }
    const vc = new Map<string, number>()
    for (const v of V.data || []) vc.set(v.lecture_id, (vc.get(v.lecture_id) || 0) + 1)
    lectures = (L.data || []).map((x: Lecture) => ({ ...x, videos: vc.get(x.id) || 0 }))
    files = F.data || []
    news = N.data || []
  }

  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-10 sm:pt-14" style={{ background: `linear-gradient(120deg, ${course.accent || '#1F5FAD'} -20%, #0A1B31 60%, #061020 100%)` }}>
        <div className="hero-grid absolute inset-0" />
        <MathField variant="vortex" className="absolute inset-0 h-full w-full opacity-60" density={0.7} />
        <div className="relative mx-auto max-w-[1680px] px-4 sm:px-7 lg:px-12 2xl:px-[72px]">
          <Link href={user ? '/dashboard' : '/courses'} className="page-enter text-[13px] text-[#AEBBCC] hover:text-white">{ar ? '→ مساقاتي' : '← My courses'}</Link>
          {course.code && <p dir="ltr" className="page-enter mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-[12.5px] font-semibold tracking-wide text-[#E3C566]">{course.code}</p>}
          <h1 className="page-enter mt-3 font-display text-[clamp(30px,4.6vw,50px)] font-semibold leading-[1.1] text-white [animation-delay:80ms] rtl:font-arabic">{name}</h1>
          {desc && <p className="page-enter mt-3 max-w-[680px] text-[15.5px] leading-relaxed text-[#AEBBCC] [animation-delay:160ms]">{desc}</p>}
          <div className="page-enter mt-5 flex flex-wrap gap-2 text-[12.5px] text-[#C4CFDE] [animation-delay:220ms]">
            {[course.semester, course.academic_year, course.level].filter(Boolean).map((x) => <span key={x} className="rounded-full border border-white/15 px-3 py-1">{x}</span>)}
            {access && <span className="rounded-full border border-[#C9A227]/40 px-3 py-1 text-[#E3C566]">{lectures.length} {ar ? 'محاضرة' : 'lectures'}</span>}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1680px] px-4 sm:px-7 lg:px-12 2xl:px-[72px] py-10">
        {!access ? (
          <div className="reveal mx-auto max-w-[620px] rounded-2xl border border-line bg-surface p-7 text-center shadow-[0_10px_30px_rgba(18,35,60,.06)]">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy text-[#E3C566]"><Lock size={22} /></span>
            <h2 className="mt-4 text-[21px] font-semibold text-ink">{ar ? 'هذا المساق يحتاج موافقة الدكتور' : 'This course needs the doctor’s approval'}</h2>
            <p className="mx-auto mt-2 max-w-[460px] text-[14.5px] text-ink-2">
              {ar ? 'أرسل طلب انضمام، وعند موافقة الدكتور ستظهر لك المحاضرات والأوراق والفيديوهات.' : 'Send a request; once the doctor approves it, the lectures, sheets and videos appear here.'}
            </p>
            <div className="mt-6 flex justify-center">
              {student ? (
                course.enrollment_open || status ? <EnrollButton courseId={course.id} status={status} studentId={student.id} /> : <p className="text-[14px] text-muted">{ar ? 'التسجيل مغلق حالياً.' : 'Enrollment is closed for now.'}</p>
              ) : user ? (
                <p className="text-[14px] text-muted">{ar ? 'هذا الحساب ليس حساب طالب.' : 'This account is not a student account.'}</p>
              ) : (
                <div className="flex gap-3">
                  <Link href={`/login?next=/courses/${course.slug}`} className="rounded-lg bg-navy px-5 py-3 text-[14.5px] font-semibold text-white">{ar ? 'تسجيل الدخول' : 'Sign in'}</Link>
                  <Link href="/register" className="rounded-lg bg-[#C9A227] px-5 py-3 text-[14.5px] font-semibold text-[#0A1A30]">{ar ? 'إنشاء حساب' : 'Create account'}</Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <section>
              <h2 className="reveal mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[.12em] text-muted rtl:tracking-normal"><BookOpen size={15} /> {ar ? 'المحاضرات' : 'Lectures'}</h2>
              {lectures.length === 0 && <p className="rounded-xl border border-dashed border-line p-8 text-center text-muted">{ar ? 'لا توجد محاضرات منشورة بعد.' : 'No lectures published yet.'}</p>}
              <ol className="space-y-3">
                {lectures.map((lec, i) => (
                  <li key={lec.id}>
                    <Link
                      href={`/courses/${course.slug}/${lec.number}`}
                      className="reveal group flex items-center gap-4 rounded-xl border border-line bg-surface p-4 transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-0.5 hover:border-[#0B6FA4]/40 hover:shadow-[0_14px_34px_rgba(18,35,60,.09)] sm:p-5"
                      style={{ ['--d' as any]: `${Math.min(i, 6) * 70}ms` }}
                    >
                      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#0B6FA4] to-[#12A4D9] text-white shadow-[0_8px_18px_rgba(11,111,164,.3)] transition-transform duration-500 group-hover:rotate-[-4deg] group-hover:scale-105">
                        <span className="text-[10px] uppercase tracking-wider opacity-80">{ar ? 'محاضرة' : 'Lec'}</span>
                        <span className="font-display text-[22px] font-semibold leading-none">{lec.number}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-semibold text-ink">{ar ? lec.title_ar || lec.title_en : lec.title_en}</span>
                        <span className="mt-1.5 flex flex-wrap gap-1.5 text-[11.5px]">
                          {(lec.show_student_sheet || isAdmin) && lec.student_sheet_key && <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-ink-2"><FileText size={11} /> {ar ? 'ورقة الطالب' : 'Student sheet'}</span>}
                          {(lec.show_doctor_sheet || isAdmin) && (lec.doctor_sheet_key || lec.student_sheet_key) && <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-ok"><FileCheck2 size={11} /> {ar ? 'المحلولة' : 'Solved'}</span>}
                          {lec.videos > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-bad-soft px-2 py-0.5 text-bad"><PlayCircle size={11} /> {lec.videos}</span>}
                          {isAdmin && !lec.is_published && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-gold-ink">draft</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <aside className="space-y-6">
              {news.length > 0 && (
                <div className="reveal rounded-xl border border-line bg-surface p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[.12em] text-muted rtl:tracking-normal"><Megaphone size={15} /> {ar ? 'إعلانات' : 'Announcements'}</h3>
                  <ul className="space-y-4">
                    {news.map((n) => (
                      <li key={n.id} className={n.is_pinned ? 'border-s-2 border-[#C9A227] ps-3' : ''}>
                        <p className="font-semibold text-ink">{ar ? n.title_ar || n.title_en : n.title_en}</p>
                        {(n.body_en || n.body_ar) && <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-2">{ar ? n.body_ar || n.body_en : n.body_en}</p>}
                        <p className="mt-1 text-[11.5px] text-muted">{new Date(n.created_at).toLocaleDateString(ar ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="reveal rounded-xl border border-line bg-surface p-5">
                <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[.12em] text-muted rtl:tracking-normal"><FileText size={15} /> {ar ? 'ملفات المساق' : 'Course files'}</h3>
                {files.length === 0 ? (
                  <p className="text-[13.5px] text-muted">{ar ? 'لا توجد ملفات بعد.' : 'No files yet.'}</p>
                ) : (
                  <ul className="space-y-1.5">
                    {files.map((f) => <FileRow key={f.id} f={f} ar={ar} />)}
                  </ul>
                )}
              </div>
              {syllabus && (
                <div className="reveal rounded-xl border border-line bg-surface p-5">
                  <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[.12em] text-muted rtl:tracking-normal">{ar ? 'وصف المساق' : 'Syllabus'}</h3>
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{syllabus}</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </>
  )
}

