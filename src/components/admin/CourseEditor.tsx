'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Save, Trash2, PlayCircle, Pin, ExternalLink, BookOpen, Paperclip, Megaphone, Settings, GripVertical, ChevronUp, ChevronDown, Loader2, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { revalidateSite } from '@/lib/admin-client'
import SheetEditor from './SheetEditor'
import FilesManager from './FilesManager'
import { AdminHero, Btn, Card, Field, HeroTabs, Toggle, inp } from './ui'

type Tab = 'lectures' | 'files' | 'news' | 'settings'
const ytId = (s: string) => s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)?.[1] || (/^[\w-]{11}$/.test(s.trim()) ? s.trim() : null)

export default function CourseEditor({ course, lectures, videos, files, news, openLecture }: { course: any; lectures: any[]; videos: any[]; files: any[]; news: any[]; openLecture?: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('lectures')
  const [sel, setSel] = useState<string | null>(openLecture || lectures[0]?.id || null)
  const lec = lectures.find((l) => l.id === sel)
  const sb = createClient()
  const accent = course.accent || '#1F5FAD'

  const addLecture = async () => {
    const n = (lectures.reduce((m, l) => Math.max(m, l.number), 0) || 0) + 1
    const { data, error } = await sb.from('lectures').insert({ course_id: course.id, number: n, title_en: `Lecture ${n}`, sort_order: n }).select('id').single()
    if (error) return alert(error.message)
    setSel(data.id)
    router.refresh()
  }

  return (
    <div className="space-y-5 p-3 sm:p-5 lg:p-7">
      <AdminHero
        icon={BookOpen}
        tone={accent}
        glyph="∂"
        title={course.name_en}
        ar={course.name_ar || undefined}
        sub={<span className="inline-flex flex-wrap items-center gap-2">
          <Link href="/admin/courses" className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-0.5 text-[12px] hover:border-white/40"><ArrowLeft size={12} className="rtl:rotate-180" /> All courses</Link>
          {course.code && <span dir="ltr" className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] text-[#E3C566]">{course.code}</span>}
          <span className={`rounded-full px-2.5 py-0.5 text-[12px] ${course.is_published ? 'bg-[#0E7C6B]' : 'bg-[#8A6D00]'}`}>{course.is_published ? 'Published · open to everyone' : 'Hidden'}</span>
        </span>}
        actions={<Link href={`/courses/${course.slug}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 px-3.5 py-2 text-[13px] text-white transition hover:border-[#C9A227] hover:text-[#E3C566]"><ExternalLink size={14} /> Open course page</Link>}
      >
        <HeroTabs
          tabs={[['lectures', `Lectures (${lectures.length})`, BookOpen], ['files', 'Course files', Paperclip], ['news', 'Announcements', Megaphone], ['settings', 'Settings', Settings]]}
          value={tab}
          onChange={setTab}
        />
      </AdminHero>

      <main>
        {tab === 'lectures' && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
              <LectureOrder lectures={lectures} sel={sel} onSelect={setSel} accent={accent} />
              <Btn kind="gold" onClick={addLecture}><Plus size={15} /> Add lecture</Btn>
            </aside>
            <div>{lec ? <LectureEditor key={`${lec.id}-${lec.number}`} lec={lec} videos={videos.filter((v) => v.lecture_id === lec.id)} files={files} courseId={course.id} courseSlug={course.slug} /> : <Card><p className="py-10 text-center text-muted">Add your first lecture.</p></Card>}</div>
          </div>
        )}

        {tab === 'files' && (
          <Card title="Course files (whole course)">
            <FilesManager courseId={course.id} lectureId={null} files={files} />
          </Card>
        )}

        {tab === 'news' && <News courseId={course.id} news={news} />}

        {tab === 'settings' && <CourseSettings course={course} />}
      </main>
    </div>
  )
}

/**
 * Lecture list with drag & drop ordering (mouse AND touch: drag the ⋮⋮ handle; the arrows work too).
 * The new order is saved at once and the lectures are renumbered 1, 2, 3 … in that order.
 */
function LectureOrder({ lectures, sel, onSelect, accent }: { lectures: any[]; sel: string | null; onSelect: (id: string) => void; accent: string }) {
  const router = useRouter()
  const [order, setOrder] = useState(lectures)
  const [drag, setDrag] = useState<string | null>(null)
  const [state, setState] = useState<'' | 'saving' | 'saved'>('')
  const listRef = useRef<HTMLUListElement>(null)
  const orderRef = useRef(lectures)
  const apply = (next: any[]) => { orderRef.current = next; setOrder(next) }
  const sig = lectures.map((l) => `${l.id}:${l.number}:${l.title_en}:${l.is_published}:${l.student_sheet_key}:${l.show_doctor_sheet}`).join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { orderRef.current = lectures; setOrder(lectures) }, [sig])

  const persist = async (next: any[]) => {
    const changed = next.map((l, i) => ({ l, n: i + 1 })).filter(({ l, n }) => l.number !== n || l.sort_order !== n)
    if (!changed.length) return
    setState('saving')
    const sb = createClient()
    const res = await Promise.all(changed.map(({ l, n }) => sb.from('lectures').update({ number: n, sort_order: n }).eq('id', l.id)))
    const err = res.find((r) => r.error)?.error
    if (err) { alert(err.message); apply(lectures); setState(''); return }
    setState('saved')
    setTimeout(() => setState(''), 2200)
    router.refresh()
  }

  const moveTo = (id: string, y: number) => {
    const list = listRef.current
    if (!list) return
    const cur = orderRef.current
    const items = Array.from(list.children) as HTMLElement[]
    const target = items.filter((el) => el.dataset.id !== id).filter((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 < y }).length
    const from = cur.findIndex((l) => l.id === id)
    if (from < 0 || target === from) return
    const next = cur.filter((l) => l.id !== id)
    next.splice(target, 0, cur[from])
    apply(next)
  }

  const step = (i: number, d: -1 | 1) => {
    const j = i + d
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    apply(next)
    persist(next)
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
        <p className="text-[12.5px] font-semibold text-ink-2">Order <span className="font-arabic font-normal text-muted">· اسحب لتغيير الترتيب</span></p>
        <span className={`ms-auto text-[12px] transition ${state ? 'opacity-100' : 'opacity-0'} ${state === 'saved' ? 'text-ok' : 'text-muted'}`}>
          {state === 'saving' ? <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> saving…</span> : 'Order saved ✓'}
        </span>
      </div>
      <ul ref={listRef} className="space-y-1.5 p-2">
        {order.map((l, i) => (
          <li
            key={l.id}
            data-id={l.id}
            className={`group flex items-center gap-2 rounded-xl border p-2 transition ${drag === l.id ? 'z-10 scale-[1.02] border-[#C9A227] bg-surface shadow-[var(--c-shadow-lg)]' : sel === l.id ? 'border-[#0B6FA4]/60 bg-sky-soft' : 'border-transparent hover:bg-surface-2'}`}
          >
            <span
              role="button"
              tabIndex={0}
              aria-label={`Drag lecture ${i + 1}`}
              title="Drag to reorder"
              className="flex h-9 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted hover:text-ink active:cursor-grabbing"
              onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDrag(l.id) }}
              onPointerMove={(e) => {
                if (drag !== l.id) return
                moveTo(l.id, e.clientY)
                if (e.clientY < 90) window.scrollBy(0, -12)
                else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 12)
              }}
              onPointerUp={() => { if (drag) { setDrag(null); persist(orderRef.current) } }}
              onPointerCancel={() => { setDrag(null); apply(lectures) }}
              onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); step(i, -1) } if (e.key === 'ArrowDown') { e.preventDefault(); step(i, 1) } }}
            >
              <GripVertical size={16} />
            </span>
            <button type="button" onClick={() => onSelect(l.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-start">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-[18px] font-semibold italic text-white shadow-[0_6px_14px_rgba(11,111,164,.25)]" style={{ background: `linear-gradient(135deg, ${accent}, #12A4D9)` }}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-ink">{l.title_en}</span>
                <span className="mt-0.5 flex flex-wrap gap-1 text-[11px]">
                  <span className={`rounded-full px-1.5 ${l.is_published ? 'bg-ok-soft text-ok' : 'bg-gold-soft text-gold-ink'}`}>{l.is_published ? 'published' : 'draft'}</span>
                  {l.student_sheet_key && <span className="rounded-full bg-sky-soft px-1.5 text-link">sheet</span>}
                  {l.show_doctor_sheet && <span className="rounded-full bg-ok-soft px-1.5 text-ok">solved</span>}
                </span>
              </span>
            </button>
            <span className="flex shrink-0 flex-col opacity-60 transition group-hover:opacity-100">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => step(i, -1)} className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30"><ChevronUp size={14} /></button>
              <button type="button" aria-label="Move down" disabled={i === order.length - 1} onClick={() => step(i, 1)} className="rounded p-0.5 text-muted hover:text-ink disabled:opacity-30"><ChevronDown size={14} /></button>
            </span>
          </li>
        ))}
        {order.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-muted">No lectures yet.</li>}
      </ul>
    </div>
  )
}

function LectureEditor({ lec, videos, files, courseId, courseSlug }: { lec: any; videos: any[]; files: any[]; courseId: string; courseSlug: string }) {
  const router = useRouter()
  const sb = createClient()
  const [f, setF] = useState({ number: lec.number, title_en: lec.title_en, title_ar: lec.title_ar || '', summary_en: lec.summary_en || '', summary_ar: lec.summary_ar || '', is_published: lec.is_published, show_student_sheet: lec.show_student_sheet, show_doctor_sheet: lec.show_doctor_sheet })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [yt, setYt] = useState({ url: '', title: '' })
  const dirty = JSON.stringify(f) !== JSON.stringify({ number: lec.number, title_en: lec.title_en, title_ar: lec.title_ar || '', summary_en: lec.summary_en || '', summary_ar: lec.summary_ar || '', is_published: lec.is_published, show_student_sheet: lec.show_student_sheet, show_doctor_sheet: lec.show_doctor_sheet })

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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Short summary (optional)"><textarea rows={2} className={inp} value={f.summary_en} onChange={(e) => setF({ ...f, summary_en: e.target.value })} /></Field>
            <Field label="ملخص قصير (اختياري)"><textarea dir="rtl" rows={2} className={inp} value={f.summary_ar} onChange={(e) => setF({ ...f, summary_ar: e.target.value })} /></Field>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
          <Toggle on={f.is_published} onChange={flip('is_published')} label="Published (visible to everyone)" />
          <Toggle on={f.show_student_sheet} onChange={flip('show_student_sheet')} label="Show student sheet" />
          <Toggle on={f.show_doctor_sheet} onChange={flip('show_doctor_sheet')} label="Release solved (doctor) sheet" />
          <span className="ms-auto">
            <Btn kind="dark" busy={saving} disabled={!dirty} onClick={() => save()}><Save size={14} /> {saved ? 'Saved ✓' : 'Save'}</Btn>
          </span>
        </div>
      </Card>

      <Card title={<span className="flex items-center gap-2"><FileText size={17} className="text-link" /> Sheets (MN syntax)</span>}>
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
        <Toggle on={!!f.is_published} onChange={(v) => setF({ ...f, is_published: v })} label="Published — open to everyone on /courses" />
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
