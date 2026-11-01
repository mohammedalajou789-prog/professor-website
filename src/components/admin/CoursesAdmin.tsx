'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, Users, Eye, EyeOff, Ban, RotateCcw, Search, ExternalLink, Sigma } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { revalidateSite } from '@/lib/admin-client'
import Enrollments, { type Row } from './Enrollments'
import { Btn, Card, Field, inp } from './ui'

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)

export default function CoursesAdmin({ courses, rows, students, r2 }: { courses: any[]; rows: Row[]; students: any[]; r2: boolean }) {
  const router = useRouter()
  const [tab, setTab] = useState<'requests' | 'courses' | 'students'>(rows.some((r) => r.status === 'pending') ? 'requests' : 'courses')
  const [creating, setCreating] = useState(false)
  const [nc, setNc] = useState({ name_en: '', name_ar: '', code: '' })
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const pending = rows.filter((r) => r.status === 'pending').length

  const create = async () => {
    if (!nc.name_en.trim()) return
    setBusy(true)
    const slug = `${slugify(nc.code || nc.name_en)}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await createClient().from('courses').insert({ ...nc, slug, is_published: false, sort_order: courses.length }).select('id').single()
    setBusy(false)
    if (error) return alert(error.message)
    router.push(`/admin/courses/${data.id}`)
  }

  const setStudent = async (id: string, status: string) => {
    await createClient().from('students').update({ status }).eq('id', id)
    router.refresh()
  }

  return (
    <div className="p-3 sm:p-5 lg:p-7">
      <header className="admin-hero overflow-hidden rounded-2xl text-white">
        <div className="relative flex flex-wrap items-center gap-3 px-4 py-5 sm:px-6">
          <Sigma className="text-[#C9A227]" />
          <h1 className="text-[18px] font-semibold">Courses & Students</h1>
          <p className="w-full text-[13px] text-[#AEBBCC] sm:ms-3 sm:w-auto">Approve students, build lectures, upload sheets · <span className="font-arabic">قبول الطلاب وبناء المحاضرات</span></p>
        </div>
        <div className="no-scrollbar relative flex gap-1 overflow-x-auto px-3 sm:px-5">
          {([
            ['requests', `Requests${pending ? ` (${pending})` : ''}`],
            ['courses', `Courses (${courses.length})`],
            ['students', `Students (${students.length})`],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`relative shrink-0 px-4 py-3 text-[14px] ${tab === id ? 'font-semibold text-[#E3C566]' : 'text-[#AEBBCC]'}`}>
              {label}
              {tab === id && <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-[#C9A227]" />}
              {id === 'requests' && pending > 0 && tab !== id && <span className="absolute end-1.5 top-2 h-2 w-2 animate-pulse rounded-full bg-[#E74C3C]" />}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-5 pt-5">
        {!r2 && (
          <p className="rounded-xl border border-gold/40 bg-gold-soft p-4 text-[13.5px] text-gold-ink">
            Cloudflare R2 is not configured yet — uploads (sheets, PDFs) will fail until the R2 variables are added (see CHANGES.md).
          </p>
        )}

        {tab === 'requests' && (
          <Card title={<span className="flex items-center gap-2"><Users size={17} /> Access requests</span>}>
            <Enrollments rows={rows} showCourse />
          </Card>
        )}

        {tab === 'courses' && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {courses.map((c) => (
                <Link key={c.id} href={`/admin/courses/${c.id}`} className="group overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(18,35,60,.1)]">
                  <div className="h-2" style={{ background: c.accent || '#1F5FAD' }} />
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      {c.code && <span className="rounded bg-surface-2 px-2 py-0.5 text-[12px] font-semibold text-ink-2">{c.code}</span>}
                      <span className={`ms-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] ${c.is_published ? 'bg-ok-soft text-ok' : 'bg-gold-soft text-gold-ink'}`}>
                        {c.is_published ? <Eye size={11} /> : <EyeOff size={11} />} {c.is_published ? 'Published' : 'Hidden'}
                      </span>
                    </div>
                    <p className="mt-2 text-[16.5px] font-semibold text-ink">{c.name_en}</p>
                    <p className="mt-2 flex gap-4 text-[12.5px] text-muted">
                      <span className="inline-flex items-center gap-1"><BookOpen size={13} /> {c.lectures?.[0]?.count ?? 0} lectures</span>
                      <span className="inline-flex items-center gap-1"><Users size={13} /> {rows.filter((r) => r.course_id === c.id && r.status === 'approved').length} students</span>
                    </p>
                  </div>
                </Link>
              ))}
              <div className="rounded-2xl border-2 border-dashed border-line-2 bg-surface/60 p-5">
                {!creating ? (
                  <button onClick={() => setCreating(true)} className="flex h-full min-h-[120px] w-full flex-col items-center justify-center gap-2 text-ink-2">
                    <Plus size={26} className="text-[#C9A227]" /> New course
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Field label="Course name (English) *"><input className={inp} value={nc.name_en} onChange={(e) => setNc({ ...nc, name_en: e.target.value })} /></Field>
                    <Field label="اسم المساق (عربي)"><input dir="rtl" className={inp} value={nc.name_ar} onChange={(e) => setNc({ ...nc, name_ar: e.target.value })} /></Field>
                    <Field label="Code (e.g. MATH 371)"><input className={inp} value={nc.code} onChange={(e) => setNc({ ...nc, code: e.target.value })} /></Field>
                    <div className="flex gap-2"><Btn kind="gold" busy={busy} onClick={create}>Create</Btn><Btn kind="ghost" onClick={() => setCreating(false)}>Cancel</Btn></div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'students' && (
          <Card
            title={<span>All students <span className="ms-1 text-[12.5px] font-normal text-muted">course access is decided per course (Requests tab) · الموافقة لكل مساق على حدة</span></span>}
            actions={
              <span className="relative">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 w-56 rounded-lg border border-line bg-surface ps-8 text-[13px] text-ink outline-none focus:border-[#C9A227]" />
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13.5px]">
                <thead>
                  <tr className="border-b border-line text-start text-[12px] text-muted">
                    <th className="py-2 text-start">Name</th><th className="text-start">University ID</th><th className="text-start">Email</th><th className="text-start">Phone</th><th className="text-start">Courses</th><th />
                  </tr>
                </thead>
                <tbody>
                  {students
                    .filter((s) => !q || [s.full_name, s.university_id, s.email, s.phone].some((x: string) => x?.toLowerCase().includes(q.toLowerCase())))
                    .map((s) => (
                      <tr key={s.id} className="border-b border-line">
                        <td className="py-2.5 font-medium text-ink">{s.full_name} {s.status === 'blocked' && <span className="ms-1 rounded bg-bad-soft px-1.5 text-[11px] text-bad">blocked</span>}</td>
                        <td className="font-mono text-[12.5px]">{s.university_id}</td>
                        <td><a className="hover:underline" href={`mailto:${s.email}`}>{s.email}</a></td>
                        <td><a className="hover:underline" href={`tel:${s.phone}`}>{s.phone}</a></td>
                        <td className="py-2">
                          <span className="flex flex-wrap gap-1">
                            {rows.filter((r) => r.student_id === s.id).map((r) => (
                              <span key={r.course_id} title={r.status} className={`rounded-full px-2 py-0.5 text-[11.5px] font-medium ${r.status === 'approved' ? 'bg-ok-soft text-ok' : r.status === 'pending' ? 'bg-gold-soft text-gold-ink' : 'bg-bad-soft text-bad'}`}>
                                {r.courses?.code || r.courses?.name_en} · {r.status === 'approved' ? '✓' : r.status === 'pending' ? '…' : '✕'}
                              </span>
                            ))}
                            {!rows.some((r) => r.student_id === s.id) && <span className="text-[12px] text-muted">—</span>}
                          </span>
                        </td>
                        <td className="text-end">
                          {s.status === 'blocked' ? (
                            <Btn small kind="ghost" onClick={() => setStudent(s.id, 'active')}><RotateCcw size={12} /> Unblock</Btn>
                          ) : (
                            <Btn small kind="danger" onClick={() => confirm(`Block ${s.full_name}? They lose access to all courses.`) && setStudent(s.id, 'blocked')}><Ban size={12} /> Block account</Btn>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        <p className="pt-2 text-center text-[12px] text-muted">
          <button onClick={() => { revalidateSite(); alert('Public pages refreshed.') }} className="inline-flex items-center gap-1 hover:text-ink"><ExternalLink size={12} /> Refresh public pages now</button>
        </p>
      </main>
    </div>
  )
}
