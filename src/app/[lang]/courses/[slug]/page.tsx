import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, Megaphone, PlayCircle, FileCheck2, BookOpen, Paperclip, ArrowUpRight, LogIn, UserPlus, WifiOff, ScrollText } from 'lucide-react'
import FileRow from '@/components/student/FileRow'
import MathField from '@/components/motion/MathField'
import SaveOffline from '@/components/offline/SaveOffline'
import { getCourseForViewer, type CourseFile, type Lecture } from '@/lib/courses'
import { isLang } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Course' }

const GLYPHS = ['∫', 'Σ', '∂', 'λ', '∇', 'Γ', 'ℒ', 'Δ', 'π', '∞']
type Lec = Lecture & { videos: number; files: number }

export default async function CoursePage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: l, slug } = await params
  const lang = isLang(l) ? l : 'en'
  const ar = lang === 'ar'
  // ONE parallel round-trip: viewer + course + lectures (with video/file counts) + course files + announcements.
  // Courses are open to everyone; RLS returns published content only (everything for the doctor).
  const sb = await createClient()
  const [{ course, isAdmin, user, canDownload }, L, F, N] = await Promise.all([
    getCourseForViewer(slug),
    sb.from('lectures').select('*, lecture_videos(count), course_files(count), courses!inner(slug)').eq('courses.slug', slug).order('number'),
    sb.from('course_files').select('*, courses!inner(slug)').eq('courses.slug', slug).is('lecture_id', null).order('sort_order').order('created_at'),
    sb.from('course_announcements').select('*, courses!inner(slug)').eq('courses.slug', slug).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(10),
  ])
  if (!course) notFound()
  const name = ar ? course.name_ar || course.name_en : course.name_en
  const desc = ar ? course.description_ar || course.description_en : course.description_en
  const syllabus = ar ? course.syllabus_ar || course.syllabus_en : course.syllabus_en
  const accent = course.accent || '#1F5FAD'

  const lectures: Lec[] = ((L.data || []) as any[])
    .filter((x) => isAdmin || x.is_published)
    .map((x) => ({ ...x, videos: x.lecture_videos?.[0]?.count ?? 0, files: x.course_files?.[0]?.count ?? 0 }))
  const files = (F.data || []) as CourseFile[]
  const news = (N.data || []) as any[]

  const hasStudent = (x: Lec) => !!x.student_sheet_key && (isAdmin || x.show_student_sheet)
  const hasSolved = (x: Lec) => !!(x.doctor_sheet_key || x.student_sheet_key) && (isAdmin || x.show_doctor_sheet)
  const stats = [
    { n: lectures.length, label: ar ? 'محاضرة' : 'Lectures', icon: BookOpen },
    { n: lectures.filter(hasStudent).length, label: ar ? 'ورقة' : 'Sheets', icon: FileText },
    { n: lectures.reduce((s, x) => s + x.videos, 0), label: ar ? 'فيديو' : 'Videos', icon: PlayCircle },
    { n: files.length + lectures.reduce((s, x) => s + x.files, 0), label: ar ? 'ملف' : 'Files', icon: Paperclip },
  ]

  // offline copy: the course page + every lecture with each sheet tab
  const base = `/courses/${course.slug}`
  const offlineUrls = [base]
  for (const x of lectures) {
    offlineUrls.push(`${base}/${x.number}`)
    if (hasStudent(x)) offlineUrls.push(`${base}/${x.number}?v=student`)
    if (hasSolved(x)) offlineUrls.push(`${base}/${x.number}?v=doctor`)
    if (x.files) offlineUrls.push(`${base}/${x.number}?v=files`)
  }
  const offlineLinks = [{ url: base, title: name, n: '∫' }, ...lectures.map((x) => ({ url: `${base}/${x.number}`, title: (ar ? x.title_ar || x.title_en : x.title_en) || `Lecture ${x.number}`, n: x.number }))]

  return (
    <div style={{ ['--acc' as any]: accent }}>
      {/* ───────────── hero ───────────── */}
      <section className="relative overflow-hidden pb-8 pt-8 sm:pb-12 sm:pt-12" style={{ background: `radial-gradient(90% 120% at 100% 0%, ${accent}55 0%, transparent 60%), linear-gradient(125deg, ${accent} -30%, #0A1B31 55%, #061020 100%)` }}>
        <div className="hero-grid absolute inset-0" />
        <MathField variant="vortex" className="absolute inset-0 h-full w-full opacity-50" density={0.6} />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 end-[4%] select-none font-display text-[clamp(180px,26vw,360px)] italic leading-none text-white/[.06]">∫</span>
        <div className="relative mx-auto max-w-[1680px] px-4 sm:px-7 lg:px-12 2xl:px-[72px]">
          <Link href={user ? '/dashboard' : '/courses'} className="page-enter inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12.5px] text-[#C4CFDE] transition hover:border-white/40 hover:text-white">
            {ar ? '→ المساقات' : '← Courses'}
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {course.code && <span dir="ltr" className="page-enter rounded-full bg-white/12 px-3 py-1 text-[12.5px] font-semibold tracking-wide text-[#E3C566] ring-1 ring-white/15">{course.code}</span>}
            {[course.level, course.semester, course.academic_year].filter(Boolean).map((x) => (
              <span key={x} className="page-enter rounded-full border border-white/15 px-3 py-1 text-[12px] text-[#C4CFDE]">{x}</span>
            ))}
          </div>
          <h1 className="page-enter mt-3 max-w-[900px] font-display text-[clamp(30px,4.8vw,54px)] font-semibold leading-[1.08] text-white [animation-delay:80ms] rtl:font-arabic">{name}</h1>
          {desc && <p className="page-enter mt-3 max-w-[720px] text-[15.5px] leading-relaxed text-[#C4CFDE] [animation-delay:140ms]">{desc}</p>}

          <div className="page-enter mt-6 grid max-w-[720px] grid-cols-4 gap-2 [animation-delay:200ms] sm:gap-3">
            {stats.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/[.06] px-2.5 py-3 text-center backdrop-blur-sm sm:px-4 sm:text-start">
                  <Icon size={15} className="mx-auto mb-1.5 text-[#E3C566] sm:mx-0" />
                  <p className="font-display text-[22px] font-semibold leading-none text-white sm:text-[26px]">{s.n}</p>
                  <p className="mt-1 truncate text-[11px] text-[#AEBBCC] sm:text-[12px]">{s.label}</p>
                </div>
              )
            })}
          </div>

          <div className="page-enter mt-6 flex flex-wrap items-center gap-2.5 [animation-delay:260ms]">
            {lectures.length > 0 && <SaveOffline id={`course:${course.slug}`} title={name} urls={offlineUrls} links={offlineLinks} ar={ar} />}
            {!user && (
              <>
                <Link href={`/login?next=${encodeURIComponent(base)}`} className="inline-flex items-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2.5 text-[13.5px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A]">
                  <LogIn size={16} /> {ar ? 'دخول لتحميل الملفات' : 'Sign in to download'}
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-[13.5px] text-white transition hover:border-[#C9A227]">
                  <UserPlus size={16} /> {ar ? 'إنشاء حساب' : 'Create account'}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ───────────── body ───────────── */}
      <div className="paper">
        <div className="mx-auto grid max-w-[1680px] grid-cols-[minmax(0,1fr)] gap-8 px-4 py-8 sm:px-7 sm:py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-12 2xl:px-[72px]">
          <section>
            <div className="card mb-5 flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${accent}, #12A4D9)` }}><BookOpen size={17} /></span>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold text-ink">{ar ? 'المحاضرات' : 'Lectures'}</h2>
                <p className="text-[12.5px] text-muted">{ar ? 'افتح أي محاضرة — متاحة للجميع. تحميل PDF يحتاج حساباً.' : 'Open any lecture — free for everyone. PDF downloads need an account.'}</p>
              </div>
              <span className="ms-auto rounded-full bg-surface-2 px-3 py-1 font-display text-[15px] italic text-gold-ink">{lectures.length}</span>
            </div>

            {lectures.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="font-display text-[44px] italic text-[#C9A227]">∅</p>
                <p className="mt-1 text-muted">{ar ? 'لا توجد محاضرات منشورة بعد.' : 'No lectures published yet.'}</p>
              </div>
            ) : (
              <ol className="lec-rail relative space-y-3.5 sm:space-y-4">
                {lectures.map((lec, i) => (
                  <LectureItem key={lec.id} lec={lec} i={i} ar={ar} base={base} isAdmin={isAdmin} student={hasStudent(lec)} solved={hasSolved(lec)} />
                ))}
              </ol>
            )}
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {news.length > 0 && (
              <div className="card reveal overflow-hidden">
                <h3 className="flex items-center gap-2 border-b border-line bg-surface-2 px-5 py-3 text-[13px] font-semibold uppercase tracking-[.12em] text-ink-2 rtl:tracking-normal"><Megaphone size={15} className="text-gold-ink" /> {ar ? 'إعلانات' : 'Announcements'}</h3>
                <ul className="divide-y divide-line">
                  {news.map((n) => (
                    <li key={n.id} className={`px-5 py-4 ${n.is_pinned ? 'border-s-[3px] border-[#C9A227] bg-gold-soft/40' : ''}`}>
                      <p className="font-semibold text-ink">{ar ? n.title_ar || n.title_en : n.title_en}</p>
                      {(n.body_en || n.body_ar) && <p className="mt-1 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-2">{ar ? n.body_ar || n.body_en : n.body_en}</p>}
                      <p className="mt-1.5 text-[11.5px] text-muted">{new Date(n.created_at).toLocaleDateString(ar ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="card reveal overflow-hidden">
              <h3 className="flex items-center gap-2 border-b border-line bg-surface-2 px-5 py-3 text-[13px] font-semibold uppercase tracking-[.12em] text-ink-2 rtl:tracking-normal"><Paperclip size={15} className="text-gold-ink" /> {ar ? 'ملفات المساق' : 'Course files'}</h3>
              <div className="p-3">
                {files.length === 0 ? (
                  <p className="px-2 py-3 text-[13.5px] text-muted">{ar ? 'لا توجد ملفات بعد.' : 'No files yet.'}</p>
                ) : (
                  <ul className="space-y-1">{files.map((f) => <FileRow key={f.id} f={f} ar={ar} canDownload={canDownload} back={base} />)}</ul>
                )}
              </div>
            </div>
            {lectures.length > 0 && (
              <div className="reveal overflow-hidden rounded-[14px] border border-[#C9A227]/30 bg-navy p-5 text-white shadow-[var(--c-shadow)]">
                <p className="flex items-center gap-2 text-[14.5px] font-semibold"><WifiOff size={16} className="text-[#E3C566]" /> {ar ? 'في القاعة بلا إنترنت؟' : 'No internet in the hall?'}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[#C4CFDE]">
                  {ar ? 'اضغط «حفظ للعرض بلا إنترنت» في أعلى الصفحة وأنت متصل، فتفتح المحاضرات والأوراق على هذا الجهاز دون اتصال.' : 'Press “Save for offline” at the top while you are online — the lectures and sheets then open on this device with no connection.'}
                </p>
              </div>
            )}
            {syllabus && (
              <div className="card reveal overflow-hidden">
                <h3 className="flex items-center gap-2 border-b border-line bg-surface-2 px-5 py-3 text-[13px] font-semibold uppercase tracking-[.12em] text-ink-2 rtl:tracking-normal"><ScrollText size={15} className="text-gold-ink" /> {ar ? 'وصف المساق' : 'Syllabus'}</h3>
                <p className="whitespace-pre-line px-5 py-4 text-[14px] leading-relaxed text-ink-2">{syllabus}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function LectureItem({ lec, i, ar, base, isAdmin, student, solved }: { lec: Lec; i: number; ar: boolean; base: string; isAdmin: boolean; student: boolean; solved: boolean }) {
  const href = `${base}/${lec.number}`
  const title = (ar ? lec.title_ar || lec.title_en : lec.title_en) || `Lecture ${lec.number}`
  const other = ar ? (lec.title_ar ? lec.title_en : null) : lec.title_ar
  const summary = ar ? lec.summary_ar || lec.summary_en : lec.summary_en
  const pill = 'relative z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium transition hover:-translate-y-px'
  return (
    <li className="reveal relative ps-[54px] sm:ps-[76px]" style={{ ['--d' as any]: `${Math.min(i, 6) * 60}ms` }}>
      {/* number on the rail */}
      <span className="lec-disc absolute start-0 top-4 flex h-[44px] w-[44px] flex-col items-center justify-center rounded-full text-white sm:top-5 sm:h-[58px] sm:w-[58px]">
        <span className="font-display text-[19px] font-semibold italic leading-none sm:text-[24px]">{lec.number}</span>
      </span>
      <article className="lec-card group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--c-shadow)]">
        <Link href={href} className="absolute inset-0 z-[1]" aria-label={title} />
        <span aria-hidden className="pointer-events-none absolute -end-2 -top-6 select-none font-display text-[120px] italic leading-none text-[var(--acc)] opacity-[.08] transition-transform duration-700 group-hover:-translate-y-1 group-hover:rotate-[-8deg]">
          {GLYPHS[i % GLYPHS.length]}
        </span>
        <div className="relative flex items-start gap-3 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[.14em] text-gold-ink rtl:tracking-normal">
              {ar ? `المحاضرة ${lec.number}` : `Lecture ${String(lec.number).padStart(2, '0')}`}
              {isAdmin && !lec.is_published && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10.5px] normal-case tracking-normal">{ar ? 'مسودة' : 'draft'}</span>}
            </p>
            <h3 className="mt-1 text-[16.5px] font-semibold leading-snug text-ink transition-colors group-hover:text-link sm:text-[18px]">{title}</h3>
            {other && <p className={`mt-0.5 line-clamp-1 text-[13px] text-muted ${ar ? '' : 'font-arabic'}`}><bdi dir={ar ? 'ltr' : 'rtl'}>{other}</bdi></p>}
            {summary && <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{summary}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {student && <Link href={`${href}?v=student`} className={`${pill} bg-sky-soft text-link`}><FileText size={13} /> {ar ? 'ورقة الطالب' : 'Student sheet'}</Link>}
              {solved && <Link href={`${href}?v=doctor`} className={`${pill} bg-ok-soft text-ok`}><FileCheck2 size={13} /> {ar ? 'المحلولة' : 'Solved'}</Link>}
              {lec.videos > 0 && <Link href={`${href}?v=videos`} className={`${pill} bg-bad-soft text-bad`}><PlayCircle size={13} /> {lec.videos} {ar ? 'فيديو' : lec.videos > 1 ? 'videos' : 'video'}</Link>}
              {lec.files > 0 && <Link href={`${href}?v=files`} className={`${pill} bg-gold-soft text-gold-ink`}><Paperclip size={13} /> {lec.files} {ar ? 'ملف' : lec.files > 1 ? 'files' : 'file'}</Link>}
            </div>
          </div>
          <span className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition duration-300 group-hover:border-[var(--acc)] group-hover:bg-[var(--acc)] group-hover:text-white sm:flex">
            <ArrowUpRight size={17} className="rtl:-scale-x-100" />
          </span>
        </div>
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[var(--acc)] to-[#12A4D9] transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right" />
      </article>
    </li>
  )
}
