'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Save, Trash2, PlayCircle, Pin, ExternalLink, BookOpen, Paperclip, Megaphone, Users, Settings, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { revalidateSite } from '@/lib/admin-client'
import SheetEditor from './SheetEditor'
import FilesManager from './FilesManager'
import Enrollments, { type Row } from './Enrollments'
import { Btn, Card, Field, Toggle, inp } from './ui'

type Tab = 'lectures' | 'files' | 'news' | 'students' | 'settings'
const ytId = (s: string) => s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)?.[1] || (/^[\w-]{11}$/.test(s.trim()) ? s.trim() : null)

export default function CourseEditor({ course, lectures, videos, files, news, rows, openLecture }: { course: any; lectures: any[]; videos: any[]; files: any[]; news: any[]; rows: Row[]; openLecture?: string }) {
  const router = useRouter()
  const pending = rows.filter((r) => r.status === 'pending').length
  const [tab, setTab] = useState<Tab>(pending ? 'students' : 'lectures')
  const [sel, setSel] = useState<string | null>(openLecture || lectures[0]?.id || null)
  const lec = lectures.find((l) => l.id === sel)
  const sb = createClient()

  const addLecture = async () => {
    const n = (lectures.reduce((m, l) => Math.max(m, l.number), 0) || 0) + 1
    const { data, error } = await sb.from('lectures').insert({ course_id: course.id, number: n, title_en: `Lecture ${n}`, sort_order: n }).select('id').single()
    if (error) return alert(error.message)
    setSel(data.id)
    router.refresh()
  }

  const TABS: [Tab, string, any][] = [
    ['lectures', `Lectures (${lectures.length})`, BookOpen],
    ['files', 'Course files', Paperclip],
    ['news', 'Announcements', Megaphone],
    ['students', `Students${pending ? ` · ${pending} pending` : ''}`, Users],
    ['settings', 'Settings', Settings],
  ]

  return (
    <div className="p-3 sm:p-5 lg:p-7">
      <header className="admin-hero overflow-hidden rounded-2xl text-white">
        <div className="relative flex flex-wrap items-center gap-3 px-4 py-5 sm:px-6">
          <Link href="/admin/courses" className="rounded-md p-1.5 hover:bg-white/10"><ArrowLeft size={18} /></Link>
          <div className="min-w-0">
            <p className="text-[12px] text-[#C9A227]">{course.code || 'Course'}</p>
            <h1 className="truncate text-[18px] font-semibold">{course.name_en}</h1>
          </div>
          <span className={`ms-auto rounded-full px-2.5 py-1 text-[12px] ${course.is_published ? 'bg-[#0E7C6B]' : 'bg-[#8A6D00]'}`}>{course.is_published ? 'Published' : 'Hidden'}</span>
          <Link href={`/courses/${course.slug}`} target="_blank" className="inline-flex items-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-[13px] hover:border-[#C9A227]"><ExternalLink size={13} /> Student view</Link>
        </div>
        <nav className="no-scrollbar relative flex gap-1 overflow-x-auto px-3 sm:px-5">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`relative flex shrink-0 items-center gap-1.5 px-3.5 py-3 text-[13.5px] ${tab === id ? 'font-semibold text-[#E3C566]' : 'text-[#AEBBCC]'}`}>
              <Icon size={15} /> {label}
              {tab === id && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#C9A227]" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="pt-5">
        {tab === 'lectures' && (
          <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-2">
              {lectures.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSel(l.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-start transition ${sel === l.id ? 'border-[#0B6FA4] bg-surface shadow-[0_6px_18px_rgba(11,111,164,.12)]' : 'border-line bg-surface/70 hover:bg-surface'}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B6FA4] to-[#12A4D9] font-display text-[18px] font-semibold text-white">{l.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">{l.title_en}</span>
                    <span className="mt-0.5 flex gap-1 text-[11px]">
                      <span className={l.is_published ? 'text-ok' : 'text-gold-ink'}>{l.is_published ? 'published' : 'draft'}</span>
                      {l.student_sheet_key && <span className="text-link">· sheet</span>}
                      {l.show_doctor_sheet && <span className="text-ok">· solved</span>}
                    </span>
                  </span>
                </button>
              ))}
              <Btn kind="gold" onClick={addLecture}><Plus size={15} /> Add lecture</Btn>
            </aside>
            <div>{lec ? <LectureEditor key={lec.id} lec={lec} videos={videos.filter((v) => v.lecture_id === lec.id)} files={files} courseId={course.id} courseSlug={course.slug} /> : <Card><p className="py-10 text-center text-muted">Add your first lecture.</p></Card>}</div>
          </div>
        )}

        {tab === 'files' && (
          <Card title="Course files (whole course)">
            <FilesManager courseId={course.id} lectureId={null} files={files} />
          </Card>
        )}

        {tab === 'news' && <News courseId={course.id} news={news} />}

        {tab === 'students' && (
          <Card title="Students in this course">
            <Enrollments rows={rows} />
          </Card>
        )}

        {tab === 'settings' && <CourseSettings course={course} />}
      </main>
    </div>
  )
}

function LectureEditor({ lec, videos, files, courseId, courseSlug }: { lec: any; videos: any[]; files: any[]; courseId: string; courseSlug: string }) {
  const router = useRouter()
  const sb = createClient()
  const [f, setF] = useState({ number: lec.number, title_en: lec.title_en, title_ar: lec.title_ar || '', summary_en: lec.summary_en || '', is_published: lec.is_published, show_student_sheet: lec.show_student_sheet, show_doctor_sheet: lec.show_doctor_sheet })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [yt, setYt] = useState({ url: '', title: '' })
  const dirty = JSON.stringify(f) !== JSON.stringify({ number: lec.number, title_en: lec.title_en, title_ar: lec.title_ar || '', summary_en: lec.summary_en || '', is_published: lec.is_published, show_student_sheet: lec.show_student_sheet, show_doctor_sheet: lec.show_doctor_sheet })

  const save = async (patch?: Partial<typeof f>) => {
    setSaving(true)
    const body = { ...f, ...patch }
    const { error } = await sb.from('lectures').update({ ...body, number: Number(body.number) || 1 }).eq('id', lec.id)
    setSaving(false)
    if (error) return alert(error.message)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    router.refresh()
  }
  // toggles save instantly
  const flip = (k: 'is_published' | 'show_student_sheet' | 'show_doctor_sheet') => (v: boolean) => {
    setF({ ...f, [k]: v })
    save({ [k]: v })
  }
  useEffect(() => setSaved(false), [lec.id])

  return (
    <div className="space-y-5">
      <Card
        title={<span>Lecture {lec.number}</span>}
        actions={
          <>
            <Link href={`/courses/${courseSlug}/${lec.number}`} target="_blank" className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-[12.5px] text-ink-2"><ExternalLink size={12} /> Open</Link>
            <Btn
              small
              kind="danger"
              onClick={async () => {
                if (!confirm(`Delete lecture ${lec.number} with its videos and files?`)) return
                await sb.from('lectures').delete().eq('id', lec.id)
                router.refresh()
              }}
            >
              <Trash2 size={12} /> Delete
            </Btn>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[90px_1fr_1fr]">
          <Field label="No."><input type="number" min={1} className={inp} value={f.number} onChange={(e) => setF({ ...f, number: e.target.value as any })} /></Field>
          <Field label="Title (English)"><input className={inp} value={f.title_en} onChange={(e) => setF({ ...f, title_en: e.target.value })} /></Field>
          <Field label="العنوان (عربي)"><input dir="rtl" className={inp} value={f.title_ar} onChange={(e) => setF({ ...f, title_ar: e.target.value })} /></Field>
        </div>
        <div className="mt-3">
          <Field label="Short summary (optional)"><textarea rows={2} className={inp} value={f.summary_en} onChange={(e) => setF({ ...f, summary_en: e.target.value })} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
          <Toggle on={f.is_published} onChange={flip('is_published')} label="Published to students" />
          <Toggle on={f.show_student_sheet} onChange={flip('show_student_sheet')} label="Show student sheet" />
          <Toggle on={f.show_doctor_sheet} onChange={flip('show_doctor_sheet')} label="Release solved (doctor) sheet" />
          <span className="ms-auto">
            <Btn kind="dark" busy={saving} disabled={!dirty} onClick={() => save()}><Save size={14} /> {saved ? 'Saved ✓' : 'Save'}</Btn>
          </span>
        </div>
      </Card>

      <Card title="Sheets (MN syntax)">
        <div className="space-y-3">
          <SheetEditor lectureId={lec.id} which="student" sheetKey={lec.student_sheet_key} onSaved={() => router.refresh()} onRemoved={async () => { await sb.from('lectures').update({ student_sheet_key: null }).eq('id', lec.id); router.refresh() }} />
          <details className="group rounded-xl border border-dashed border-line-2 bg-surface-2/60 open:bg-transparent" open={!!lec.doctor_sheet_key}>
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[13px] text-ink-2">
              <span className="transition-transform group-open:rotate-90">›</span> Advanced: a separate solved file <span className="font-arabic text-muted">· متقدم: ملف محلول منفصل (غير ضروري عادةً)</span>
            </summary>
            <div className="px-3 pb-3">
              <SheetEditor lectureId={lec.id} which="doctor" sheetKey={lec.doctor_sheet_key} onSaved={() => router.refresh()} onRemoved={async () => { await sb.from('lectures').update({ doctor_sheet_key: null }).eq('id', lec.id); router.refresh() }} />
            </div>
          </details>
          <p className="text-[12px] leading-relaxed text-muted">
            One .mn file is enough: the <b>student</b> version hides solutions and MCQ answers automatically, the <b>doctor</b> version shows everything. Upload a separate doctor file only if the solved version is different. Students see the solved version only after you switch on “Release solved (doctor) sheet”.
          </p>
          <p dir="rtl" lang="ar" className="mt-1.5 font-arabic text-[12.5px] leading-relaxed text-muted">
            ملف واحد يكفي: نسخة <b>الطالب</b> تُخفي الحلول تلقائياً، ونسخة <b>الدكتور</b> هي نفس الملف مع الحلول ظاهرة. الطلاب لا يرون النسخة المحلولة إلا بعد تفعيل “Release solved (doctor) sheet”.
          </p>
        </div>
      </Card>

      <Card title={<span className="flex items-center gap-2"><PlayCircle size={17} className="text-bad" /> Videos (YouTube unlisted)</span>}>
        <ul className="mb-3 space-y-2">
          {videos.map((v, i) => (
            <li key={v.id} className="flex items-center gap-3 rounded-lg border border-line p-2">
              <GripVertical size={14} className="text-[#C9D3E0]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" className="h-12 w-20 rounded object-cover" />
              <input
                defaultValue={v.title_en || ''}
                placeholder={`Video ${i + 1}`}
                className="min-w-0 flex-1 rounded border border-transparent px-1.5 py-1 text-[14px] hover:border-line focus:border-[#C9A227] focus:outline-none"
                onBlur={async (e) => await sb.from('lecture_videos').update({ title_en: e.target.value }).eq('id', v.id)}
              />
              <button onClick={async () => { if (confirm('Remove video?')) { await sb.from('lecture_videos').delete().eq('id', v.id); router.refresh() } }} className="p-1.5 text-bad/70 hover:text-bad"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]">
          <input className={inp} dir="ltr" placeholder="YouTube link (unlisted)" value={yt.url} onChange={(e) => setYt({ ...yt, url: e.target.value })} />
          <input className={inp} placeholder="Title (optional)" value={yt.title} onChange={(e) => setYt({ ...yt, title: e.target.value })} />
          <Btn
            kind="dark"
            onClick={async () => {
              const id = ytId(yt.url)
              if (!id) return alert('Paste a valid YouTube link')
              const { error } = await sb.from('lecture_videos').insert({ lecture_id: lec.id, youtube_id: id, title_en: yt.title || null, sort_order: videos.length })
              if (error) return alert(error.message)
              setYt({ url: '', title: '' })
              router.refresh()
            }}
          >
            <Plus size={14} /> Add
          </Btn>
        </div>
      </Card>

      <Card title="Lecture files">
        <FilesManager courseId={courseId} lectureId={lec.id} files={files} />
      </Card>
    </div>
  )
}

function News({ courseId, news }: { courseId: string; news: any[] }) {
  const router = useRouter()
  const sb = createClient()
  const [n, setN] = useState({ title_en: '', body_en: '', is_pinned: false })
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="New announcement">
        <div className="space-y-3">
          <Field label="Title"><input className={inp} value={n.title_en} onChange={(e) => setN({ ...n, title_en: e.target.value })} /></Field>
          <Field label="Message"><textarea rows={5} className={inp} value={n.body_en} onChange={(e) => setN({ ...n, body_en: e.target.value })} /></Field>
          <Toggle on={n.is_pinned} onChange={(v) => setN({ ...n, is_pinned: v })} label="Pin to top" />
          <Btn kind="gold" onClick={async () => { if (!n.title_en) return; await sb.from('course_announcements').insert({ ...n, course_id: courseId }); setN({ title_en: '', body_en: '', is_pinned: false }); router.refresh() }}><Megaphone size={14} /> Publish</Btn>
        </div>
      </Card>
      <Card title="Published">
        <ul className="space-y-3">
          {news.length === 0 && <li className="text-[13px] text-[#A9B6C9]">None yet.</li>}
          {news.map((a) => (
            <li key={a.id} className="rounded-lg border border-line p-3">
              <div className="flex items-start gap-2">
                <p className="flex-1 font-semibold text-ink">{a.is_pinned && <Pin size={13} className="me-1 inline text-[#C9A227]" />}{a.title_en}</p>
                <button onClick={async () => { await sb.from('course_announcements').update({ is_pinned: !a.is_pinned }).eq('id', a.id); router.refresh() }} className="p-1 text-muted"><Pin size={14} /></button>
                <button onClick={async () => { if (confirm('Delete?')) { await sb.from('course_announcements').delete().eq('id', a.id); router.refresh() } }} className="p-1 text-bad/70"><Trash2 size={14} /></button>
              </div>
              {a.body_en && <p className="mt-1 whitespace-pre-line text-[13.5px] text-ink-2">{a.body_en}</p>}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function CourseSettings({ course }: { course: any }) {
  const router = useRouter()
  const sb = createClient()
  const keys = ['name_en', 'name_ar', 'code', 'slug', 'description_en', 'description_ar', 'syllabus_en', 'syllabus_ar', 'semester', 'academic_year', 'level', 'accent', 'sort_order', 'is_published', 'enrollment_open'] as const
  const [f, setF] = useState<any>(Object.fromEntries(keys.map((k) => [k, course[k] ?? (k === 'is_published' || k === 'enrollment_open' ? false : '')])))
  const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return (
    <Card
      title="Course settings"
      actions={
        <Btn
          kind="danger"
          small
          onClick={async () => {
            if (prompt(`Type DELETE to remove "${course.name_en}" with all lectures, files and enrollments.`) !== 'DELETE') return
            await sb.from('courses').delete().eq('id', course.id)
            revalidateSite()
            router.push('/admin/courses')
          }}
        >
          <Trash2 size={12} /> Delete course
        </Btn>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name (English)"><input className={inp} value={f.name_en} onChange={set('name_en')} /></Field>
        <Field label="الاسم (عربي)"><input dir="rtl" className={inp} value={f.name_ar} onChange={set('name_ar')} /></Field>
        <Field label="Code"><input className={inp} value={f.code} onChange={set('code')} /></Field>
        <Field label="URL slug" hint={`ahmadelajou.com/courses/${f.slug}`}><input dir="ltr" className={inp} value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Field>
        <Field label="Description (English)"><textarea rows={3} className={inp} value={f.description_en} onChange={set('description_en')} /></Field>
        <Field label="الوصف (عربي)"><textarea dir="rtl" rows={3} className={inp} value={f.description_ar} onChange={set('description_ar')} /></Field>
        <Field label="Syllabus (English)"><textarea rows={4} className={inp} value={f.syllabus_en} onChange={set('syllabus_en')} /></Field>
        <Field label="الخطة الدراسية (عربي)"><textarea dir="rtl" rows={4} className={inp} value={f.syllabus_ar} onChange={set('syllabus_ar')} /></Field>
        <Field label="Semester"><input className={inp} value={f.semester} onChange={set('semester')} placeholder="First semester" /></Field>
        <Field label="Academic year"><input className={inp} value={f.academic_year} onChange={set('academic_year')} placeholder="2026/2027" /></Field>
        <Field label="Level"><input className={inp} value={f.level} onChange={set('level')} placeholder="Undergraduate" /></Field>
        <Field label="Accent colour"><input type="color" className="h-11 w-full cursor-pointer rounded-lg border border-line" value={f.accent || '#1F5FAD'} onChange={set('accent')} /></Field>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-line pt-4">
        <Toggle on={!!f.is_published} onChange={(v) => setF({ ...f, is_published: v })} label="Published (visible on /courses)" />
        <Toggle on={!!f.enrollment_open} onChange={(v) => setF({ ...f, enrollment_open: v })} label="Accept new access requests" />
        <span className="ms-auto">
          <Btn
            kind="dark"
            busy={busy}
            onClick={async () => {
              setBusy(true)
              const { error } = await sb.from('courses').update({ ...f, sort_order: Number(f.sort_order) || 0 }).eq('id', course.id)
              setBusy(false)
              if (error) return alert(error.message)
              revalidateSite()
              router.refresh()
            }}
          >
            <Save size={14} /> Save settings
          </Btn>
        </span>
      </div>
    </Card>
  )
}
