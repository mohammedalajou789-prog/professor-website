'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Phone, Mail, Search, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Btn } from './ui'

export type Row = { student_id: string; course_id: string; status: string; requested_at: string; students: { full_name: string; university_id: string; email: string; phone: string; status: string }; courses?: { name_en: string; code: string | null } }

function groups(rows: Row[]) {
  const m = new Map<string, Row[]>()
  for (const r of rows) m.set(r.course_id, [...(m.get(r.course_id) || []), r])
  return [...m.entries()]
}

/** Approve / reject / remove — per course (one row = one student in one course). Works well on a phone. */
export default function Enrollments({ rows, showCourse }: { rows: Row[]; showCourse?: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>(rows.some((r) => r.status === 'pending') ? 'pending' : 'all')

  const setStatus = async (r: Row, status: 'approved' | 'rejected') => {
    setBusy(r.student_id + r.course_id)
    await createClient().from('enrollments').update({ status, decided_at: new Date().toISOString() }).eq('student_id', r.student_id).eq('course_id', r.course_id)
    setBusy(null)
    router.refresh()
  }
  const remove = async (r: Row) => {
    if (!confirm(`Remove ${r.students.full_name} from this course?`)) return
    await createClient().from('enrollments').delete().eq('student_id', r.student_id).eq('course_id', r.course_id)
    router.refresh()
  }
  const approveAll = async () => {
    const pend = rows.filter((r) => r.status === 'pending')
    if (!pend.length || !confirm(`Approve all ${pend.length} pending requests?`)) return
    const sb = createClient()
    for (const r of pend) await sb.from('enrollments').update({ status: 'approved', decided_at: new Date().toISOString() }).eq('student_id', r.student_id).eq('course_id', r.course_id)
    router.refresh()
  }

  const ql = q.toLowerCase()
  const shown = rows.filter((r) => (filter === 'all' || r.status === filter) && (!ql || [r.students.full_name, r.students.university_id, r.students.email, r.students.phone].some((x) => x?.toLowerCase().includes(ql))))
  const count = (s: string) => rows.filter((r) => r.status === s).length

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium capitalize ${filter === f ? 'bg-navy text-white' : 'bg-surface-2 text-ink-2'}`}>
            {f} {f !== 'all' && <span className="opacity-70">({count(f)})</span>}
          </button>
        ))}
        {count('pending') > 1 && <Btn small kind="green" onClick={approveAll}><Check size={13} /> Approve all</Btn>}
        <span className="relative ms-auto w-full sm:w-64">
          <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, ID, email, phone" className="h-9 w-full rounded-lg border border-line bg-surface ps-8 text-[13px] text-ink outline-none focus:border-[#C9A227]" />
        </span>
      </div>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-[13.5px] text-muted">Nothing here.</p>
      ) : (
        // grouped by course: every decision applies to THIS course only
        <div className="space-y-4">
          {groups(shown).map(([cid, list]) => {
            const c = list[0].courses
            const code = c ? c.code || c.name_en : ''
            return (
              <section key={cid} className={showCourse ? 'overflow-hidden rounded-xl border border-line' : ''}>
                {showCourse && (
                  <header className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
                    <span className="rounded-md bg-navy px-2 py-0.5 text-[12px] font-semibold text-white">{c?.code || 'Course'}</span>
                    <span className="font-semibold text-ink">{c?.name_en}</span>
                    <span className="ms-auto text-[12px] text-muted">decisions apply to this course only · <span className="font-arabic">القرار لهذا المساق فقط</span></span>
                  </header>
                )}
                <ul className={`divide-y divide-line ${showCourse ? 'px-4' : ''}`}>
                  {list.map((r) => (
                    <li key={r.student_id + r.course_id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">
                          {r.students.full_name} <span dir="ltr" className="ms-1 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-ink-2">{r.students.university_id}</span>
                          {r.students.status === 'blocked' && <span className="ms-1 rounded bg-bad-soft px-1.5 text-[11px] text-bad">blocked</span>}
                          <span className={`ms-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${r.status === 'approved' ? 'bg-ok-soft text-ok' : r.status === 'pending' ? 'bg-gold-soft text-gold-ink' : 'bg-bad-soft text-bad'}`}>{r.status}</span>
                        </p>
                        <p className="mt-0.5 flex flex-wrap gap-x-3 text-[12.5px] text-muted">
                          <a href={`mailto:${r.students.email}`} className="inline-flex items-center gap-1 hover:text-ink"><Mail size={12} /> {r.students.email}</a>
                          <a href={`tel:${r.students.phone}`} className="inline-flex items-center gap-1 hover:text-ink"><Phone size={12} /> {r.students.phone}</a>
                          <span>{new Date(r.requested_at).toLocaleDateString('en-GB')}</span>
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {r.status !== 'approved' && <Btn small kind="green" busy={busy === r.student_id + r.course_id} onClick={() => setStatus(r, 'approved')}><Check size={13} /> Approve{showCourse && code ? ` · ${code}` : ''}</Btn>}
                        {r.status === 'pending' && <Btn small kind="danger" onClick={() => setStatus(r, 'rejected')}><X size={13} /> Reject</Btn>}
                        {r.status === 'approved' && <Btn small kind="ghost" onClick={() => setStatus(r, 'rejected')}><X size={13} /> Revoke</Btn>}
                        {r.status !== 'pending' && <Btn small kind="ghost" onClick={() => remove(r)}><Trash2 size={13} /></Btn>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
