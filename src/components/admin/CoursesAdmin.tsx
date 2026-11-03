'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, BookOpen, Users, Eye, EyeOff, Ban, RotateCcw, Search, RefreshCw, School, ArrowUpRight, Mail, Phone, IdCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { revalidateSite } from '@/lib/admin-client'
import { AdminHero, Btn, Card, Field, HeroTabs, inp } from './ui'

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
const GLYPHS = ['∫', 'Σ', '∂', 'λ', '∇', 'Γ', 'ℒ', 'Δ']

export default function CoursesAdmin({ courses, students, r2 }: { courses: any[]; students: any[]; r2: boolean }) {
  const router = useRouter()
  const [tab, setTab] = useState<'courses' | 'students'>('courses')
  const [creating, setCreating] = useState(false)
  const [nc, setNc] = useState({ name_en: '', name_ar: '', code: '' })
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [refreshed, setRefreshed] = useState(false)

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

  const ql = q.toLowerCase()
  const shown = students.filter((s) => !ql || [s.full_name, s.university_id, s.email, s.phone].some((x: string) => x?.toLowerCase().includes(ql)))

  return (
    <div className="space-y-5 p-3 sm:p-5 lg:p-7">
      <AdminHero
        icon={School}
        glyph="Σ"
        title="Courses & Students"
        ar="المساقات والطلاب"
        sub={<>Every published course is open to everyone — no approvals. Students need an account only to download files. · <span className="font-arabic">كل مساق منشور مفتوح للجميع دون موافقة.</span></>}
        actions={<Btn kind="gold" onClick={() => { setTab('courses'); setCreating(true) }}><Plus size={15} /> New course</Btn>}
      >
        <HeroTabs
          tabs={[['courses', `Courses (${courses.length})`, BookOpen], ['students', `Students (${students.length})`, Users]]}
          value={tab}
          onChange={setTab}
        />
      </AdminHero>

      {!r2 && (
        <p className="rounded-xl border border-gold/40 bg-gold-soft p-4 text-[13.5px] text-gold-ink">
          Cloudflare R2 is not configured yet — uploads (sheets, PDFs) will fail until the R2 variables are added (see CHANGES.md).
        </p>
      )}

      {tab === 'courses' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c, i) => {
            const accent = c.accent || '#1F5FAD'
            return (
              <Link key={c.id} href={`/admin/courses/${c.id}`} className="reveal group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--c-shadow)] transition duration-500 hover:-translate-y-1 hover:shadow-[var(--c-shadow-lg)]" style={{ ['--d' as any]: `${(i % 3) * 80}ms` }}>
                <div className="relative h-28 overflow-hidden" style={{ background: `radial-gradient(90% 130% at 100% 0%, ${accent}aa 0%, transparent 60%), linear-gradient(125deg, ${accent} -20%, #0A1B31 75%)` }}>
                  <span aria-hidden className="absolute -bottom-7 end-3 font-display text-[110px] italic leading-none text-white/15 transition-transform duration-700 group-hover:-translate-y-2 group-hover:rotate-[-8deg]">{GLYPHS[i % GLYPHS.length]}</span>
                  <div className="absolute inset-x-4 top-3 flex items-center gap-2">
                    {c.code && <span dir="ltr" className="rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur">{c.code}</span>}
                    <span className={`ms-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${c.is_published ? 'bg-[#0E7C6B] text-white' : 'bg-[#C9A227] text-[#0A1A30]'}`}>
                      {c.is_published ? <Eye size={12} /> : <EyeOff size={12} />} {c.is_published ? 'Published' : 'Hidden'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[17px] font-semibold leading-snug text-ink">{c.name_en}</p>
                  {c.name_ar && <p dir="rtl" className="mt-0.5 font-arabic text-[13.5px] text-muted">{c.name_ar}</p>}
                  <div className="mt-auto flex items-center gap-4 pt-4 text-[12.5px] text-ink-2">
                    <span className="inline-flex items-center gap-1.5"><BookOpen size={14} className="text-link" /> {c.lectures?.[0]?.count ?? 0} lectures</span>
                    <span className="ms-auto flex h-9 w-9 items-center justify-center rounded-full border border-line transition group-hover:border-[#C9A227] group-hover:bg-[#C9A227] group-hover:text-[#0A1A30]"><ArrowUpRight size={16} /></span>
                  </div>
                </div>
              </Link>
            )
          })}
          <div className="rounded-2xl border-2 border-dashed border-line-2 bg-surface/70 p-5">
            {!creating ? (
              <button onClick={() => setCreating(true)} className="group flex h-full min-h-[180px] w-full flex-col items-center justify-center gap-2 text-ink-2">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-gold-ink transition group-hover:scale-110"><Plus size={26} /></span>
                New course <span className="font-arabic text-[12.5px] text-muted">مساق جديد</span>
              </button>
            ) : (
              <div className="space-y-3">
                <Field label="Course name (English) *"><input className={inp} value={nc.name_en} onChange={(e) => setNc({ ...nc, name_en: e.target.value })} autoFocus /></Field>
                <Field label="اسم المساق (عربي)"><input dir="rtl" className={inp} value={nc.name_ar} onChange={(e) => setNc({ ...nc, name_ar: e.target.value })} /></Field>
                <Field label="Code (e.g. MATH 371)"><input className={inp} value={nc.code} onChange={(e) => setNc({ ...nc, code: e.target.value })} /></Field>
                <div className="flex gap-2"><Btn kind="gold" busy={busy} onClick={create}>Create</Btn><Btn kind="ghost" onClick={() => setCreating(false)}>Cancel</Btn></div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'students' && (
        <Card
          title={<span className="flex items-center gap-2">Registered students <span className="text-[12.5px] font-normal text-muted">they can download files · <span className="font-arabic">يستطيعون تحميل الملفات</span></span></span>}
          actions={
            <span className="relative">
              <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, ID, email, phone" className="h-9 w-60 rounded-lg border border-line bg-surface ps-8 text-[13px] text-ink outline-none focus:border-[#C9A227]" />
            </span>
          }
        >
          {shown.length === 0 ? (
            <p className="py-8 text-center text-[13.5px] text-muted">No students yet.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {shown.map((s) => (
                <li key={s.id} className={`flex items-start gap-3 rounded-xl border p-3.5 transition ${s.status === 'blocked' ? 'border-bad/30 bg-bad-soft/40' : 'border-line bg-surface-2/60 hover:border-[#C9A227]/50'}`}>
                  <span className="admin-chip h-11 w-11 shrink-0 font-display text-[17px] font-semibold" style={{ ['--tile' as any]: s.status === 'blocked' ? '#A33025' : '#0B6FA4' }}>
                    {(s.full_name || '?').trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">
                      {s.full_name} {s.status === 'blocked' && <span className="ms-1 rounded bg-bad-soft px-1.5 text-[11px] text-bad">blocked</span>}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted">
                      <span className="inline-flex items-center gap-1 font-mono"><IdCard size={12} /> {s.university_id}</span>
                      <a href={`mailto:${s.email}`} className="inline-flex min-w-0 items-center gap-1 truncate hover:text-ink"><Mail size={12} /> {s.email}</a>
                      <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 hover:text-ink"><Phone size={12} /> {s.phone}</a>
                    </p>
                  </div>
                  {s.status === 'blocked' ? (
                    <Btn small kind="ghost" onClick={() => setStudent(s.id, 'active')}><RotateCcw size={12} /> Unblock</Btn>
                  ) : (
                    <Btn small kind="danger" onClick={() => confirm(`Block ${s.full_name}? They can no longer download files.`) && setStudent(s.id, 'blocked')}><Ban size={12} /> Block</Btn>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <p className="pt-1 text-center text-[12px] text-muted">
        <button onClick={() => { revalidateSite(); setRefreshed(true); setTimeout(() => setRefreshed(false), 2500) }} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 hover:text-ink">
          <RefreshCw size={12} /> {refreshed ? 'Public pages refreshed ✓' : 'Refresh public pages now'}
        </button>
      </p>
    </div>
  )
}
