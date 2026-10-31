import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { FileText, FileCheck2, PlayCircle, Paperclip, ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import Sheet from '@/components/mn/Sheet'
import FileRow from '@/components/student/FileRow'
import { parseMN } from '@/lib/mn/parse'
import { attachPy } from '@/lib/mn/pyfigs'
import { getCourseForViewer, readSheet, type CourseFile, type Lecture, type Video } from '@/lib/courses'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Lecture', robots: { index: false } }

type Tab = 'student' | 'doctor' | 'videos' | 'files'

export default async function LecturePage({ params, searchParams }: { params: Promise<{ lang: string; slug: string; lecture: string }>; searchParams: Promise<{ v?: string }> }) {
  const [{ lang: l, slug, lecture: num }, sp] = await Promise.all([params, searchParams])
  const lang = isLang(l) ? l : 'en'
  const ar = lang === 'ar'
  const { course, access, isAdmin, student, supabase } = await getCourseForViewer(slug)
  if (!course) notFound()
  if (!access) redirect(`/courses/${slug}`)

  let lq = supabase.from('lectures').select('*').eq('course_id', course.id).order('number')
  if (!isAdmin) lq = lq.eq('is_published', true)
  const { data: all } = await lq
  const lectures = (all || []) as Lecture[]
  const idx = lectures.findIndex((x) => String(x.number) === num)
  if (idx < 0) notFound()
  const lec = lectures[idx]
  const prev = lectures[idx - 1], next = lectures[idx + 1]

  const [{ data: videos }, { data: files }] = await Promise.all([
    supabase.from('lecture_videos').select('*').eq('lecture_id', lec.id).order('sort_order'),
    supabase.from('course_files').select('*').eq('lecture_id', lec.id).order('sort_order'),
  ])

  const canStudent = !!lec.student_sheet_key && (isAdmin || lec.show_student_sheet)
  const canDoctor = !!(lec.doctor_sheet_key || lec.student_sheet_key) && (isAdmin || lec.show_doctor_sheet)
  const tabs: { id: Tab; label: string; icon: any; on: boolean; count?: number }[] = [
    { id: 'student', label: ar ? 'ورقة الطالب' : 'Student sheet', icon: FileText, on: canStudent },
    { id: 'doctor', label: ar ? 'الورقة المحلولة' : 'Doctor sheet', icon: FileCheck2, on: canDoctor },
    { id: 'videos', label: ar ? 'الفيديوهات' : 'Videos', icon: PlayCircle, on: (videos || []).length > 0, count: (videos || []).length },
    { id: 'files', label: ar ? 'الملفات' : 'Files', icon: Paperclip, on: (files || []).length > 0, count: (files || []).length },
  ]
  const requested = sp.v as Tab | undefined
  const active: Tab = requested && tabs.find((t) => t.id === requested && t.on) ? requested : tabs.find((t) => t.on)?.id || 'student'

  let sheet: React.ReactNode = null
  if (active === 'student' || active === 'doctor') {
    const key = active === 'doctor' ? lec.doctor_sheet_key || lec.student_sheet_key : lec.student_sheet_key || lec.doctor_sheet_key
    const src = key ? await readSheet(key).catch(() => null) : null
    if (src) {
      const doc = await attachPy(parseMN(src))
      sheet = (
        <Sheet
          doc={doc}
          mode={active}
          courseName={course.name_en}
          watermark={student && !isAdmin ? student.university_id : null}
          pyLive={isAdmin ? 'upload' : false}
          pdfHref={`/api/sheet-pdf/${lec.id}?v=${active}&lang=${lang}`}
        />
      )
    }
  }

  const title = ar ? lec.title_ar || lec.title_en : lec.title_en

  return (
    <div className="paper min-h-screen">
      {/* lecture header + tabs */}
      <div className="sticky top-16 z-30 border-b border-line bg-surface/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1680px] items-center gap-3 px-4 sm:px-7 lg:px-12 2xl:px-[72px] pt-2.5">
          <Link href={`/courses/${course.slug}`} className="shrink-0 rounded-md px-2 py-1 text-[12.5px] text-ink-2 hover:bg-surface-2">
            {ar ? course.name_ar || course.name_en : course.name_en}
          </Link>
          <span className="text-line-2">/</span>
          <p className="min-w-0 truncate text-[13.5px] font-semibold text-ink">
            <span className="text-link">{ar ? 'محاضرة' : 'Lecture'} {lec.number}</span> · {title}
          </p>
          {isAdmin && (
            <Link href={`/admin/courses/${course.id}?lecture=${lec.id}`} className="ms-auto shrink-0 rounded-md bg-navy px-2.5 py-1 text-[12px] text-white">
              Edit
            </Link>
          )}
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-[1680px] gap-1 overflow-x-auto px-4 sm:px-7 lg:px-12 2xl:px-[72px]" aria-label="Lecture sections">
          {tabs.map((t) => {
            const Icon = t.icon
            const is = t.id === active
            return t.on ? (
              <Link
                key={t.id}
                href={`?v=${t.id}`}
                scroll={false}
                prefetch
                className={`relative flex shrink-0 items-center gap-1.5 px-3.5 py-3 text-[13.5px] font-medium transition ${is ? 'text-link' : 'text-ink-2 hover:text-ink'}`}
              >
                <Icon size={16} /> {t.label}
                {!!t.count && <span className="rounded-full bg-surface-2 px-1.5 text-[11px] text-ink-2">{t.count}</span>}
                <span className={`absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-gradient-to-r from-[#0B6FA4] to-[#12A4D9] transition-transform duration-300 ${is ? 'scale-x-100' : 'scale-x-0'}`} />
              </Link>
            ) : (
              <span key={t.id} className="flex shrink-0 cursor-not-allowed items-center gap-1.5 px-3.5 py-3 text-[13.5px] text-muted/60" title={ar ? 'غير متاح بعد' : 'Not available yet'}>
                <Lock size={13} /> {t.label}
              </span>
            )
          })}
        </nav>
      </div>

      <div className="px-0 py-5 sm:px-6 sm:py-8">
        {(active === 'student' || active === 'doctor') &&
          (sheet || (
            <Empty text={ar ? 'لم تُرفع الورقة بعد.' : 'This sheet has not been uploaded yet.'} />
          ))}

        {active === 'videos' && (
          <div className="mx-auto grid max-w-[1000px] gap-6 px-4 sm:px-0">
            {(videos as Video[]).map((v, i) => (
              <div key={v.id} className="reveal overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_12px_34px_rgba(18,35,60,.08)]" style={{ ['--d' as any]: `${i * 90}ms` }}>
                <div className="relative aspect-video bg-deep">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${v.youtube_id}?rel=0&modestbranding=1`}
                    title={(ar ? v.title_ar || v.title_en : v.title_en) || `Video ${i + 1}`}
                    loading={i ? 'lazy' : 'eager'}
                    allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
                <p className="flex items-center gap-2 px-4 py-3 text-[14.5px] font-semibold text-ink">
                  <PlayCircle size={17} className="text-bad" /> {(ar ? v.title_ar || v.title_en : v.title_en) || `${ar ? 'فيديو' : 'Video'} ${i + 1}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {active === 'files' && (
          <div className="mx-auto max-w-[760px] rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <ul className="space-y-1">{(files as CourseFile[]).map((f) => <FileRow key={f.id} f={f} ar={ar} />)}</ul>
          </div>
        )}

        {/* prev / next */}
        <div className="mx-auto mt-8 flex max-w-[860px] items-stretch justify-between gap-3 px-4 sm:px-0">
          {prev ? (
            <Link href={`/courses/${course.slug}/${prev.number}`} className="group flex max-w-[48%] items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-start transition hover:border-[#0B6FA4]/40">
              <ChevronLeft size={18} className="shrink-0 text-link transition group-hover:-translate-x-0.5 rtl:rotate-180" />
              <span className="min-w-0">
                <span className="block text-[11.5px] text-muted">{ar ? 'السابقة' : 'Previous'} · {prev.number}</span>
                <span className="block truncate text-[13.5px] font-medium text-ink">{ar ? prev.title_ar || prev.title_en : prev.title_en}</span>
              </span>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={`/courses/${course.slug}/${next.number}`} className="group flex max-w-[48%] items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-end transition hover:border-[#0B6FA4]/40">
              <span className="min-w-0">
                <span className="block text-[11.5px] text-muted">{ar ? 'التالية' : 'Next'} · {next.number}</span>
                <span className="block truncate text-[13.5px] font-medium text-ink">{ar ? next.title_ar || next.title_en : next.title_en}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-link transition group-hover:translate-x-0.5 rtl:rotate-180" />
            </Link>
          ) : <span />}
        </div>
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mx-auto max-w-[620px] rounded-2xl border border-dashed border-line-2 bg-surface/70 p-10 text-center text-muted">
      <p className="font-display text-[42px] italic text-[#C9A227]">∅</p>
      <p className="mt-2">{text}</p>
    </div>
  )
}
