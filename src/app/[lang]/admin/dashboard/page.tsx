// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, BookOpen, Newspaper,
  User, GraduationCap, Award, Users, Globe,
  LogOut, Plus, Edit, Trash2, Save, X, Upload,
  ChevronDown, ChevronUp, Eye
} from 'lucide-react'
import Link from 'next/link'
import { uploadToR2, revalidateSite } from '@/lib/admin-client'

type Section = 'overview' | 'profile' | 'publications' | 'news' | 'education' |
  'positions' | 'awards' | 'memberships' | 'committees' | 'conferences' | 'supervision' | 'interests'

export default function DashboardPage() {
  const sp = useSearchParams()
  const section = (sp.get('s') || 'overview') as Section
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ publications: 0, news: 0, courses: 0, interests: 0, students: 0, pending: 0 })
  const router = useRouter()
  const setSection = (x: Section) => router.push(x === 'overview' ? '/admin/dashboard' : `/admin/dashboard?s=${x}`)

  useEffect(() => {
    async function init() {
      try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user && process.env.NEXT_PUBLIC_ADMIN_PREVIEW !== '1') { router.push('/admin/login'); return }
      setUser(user)
      const head = { count: 'exact', head: true }
      const [pub, news, interests, courses, students, pending] = await Promise.all([
        supabase.from('publications').select('id', head),
        supabase.from('news_activities').select('id', head),
        supabase.from('research_interests').select('id', head),
        supabase.from('courses').select('id', head),
        supabase.from('students').select('id', head),
        supabase.from('enrollments').select('id', head).eq('status', 'pending'),
      ])
      setStats({
        publications: pub.count || 0,
        news: news.count || 0,
        courses: courses.count || 0,
        interests: interests.count || 0,
        students: students.count || 0,
        pending: pending.count || 0,
      })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'publications', icon: FileText, label: 'Publications' },
    { id: 'interests', icon: BookOpen, label: 'Research Interests' },
    { id: 'news', icon: Newspaper, label: 'News & Activities' },
    { id: 'education', icon: GraduationCap, label: 'Education' },
    { id: 'positions', icon: Users, label: 'Positions' },
    { id: 'awards', icon: Award, label: 'Awards' },
    { id: 'memberships', icon: Globe, label: 'Memberships' },
    { id: 'committees', icon: Users, label: 'Committees' },
    { id: 'conferences', icon: BookOpen, label: 'Conferences' },
    { id: 'supervision', icon: GraduationCap, label: 'Supervision' },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2">
      <div className="w-10 h-10 border-4 border-navy border-t-[#C9A84C] rounded-full animate-spin" />
    </div>
  )

  return (
    <div>

      {/* Main Content */}
      <main className="min-w-0 p-3 sm:p-5 lg:p-7">

        {/* Overview */}
        {section === 'overview' && (
          <div className="space-y-5">
            <header className="admin-hero relative overflow-hidden rounded-2xl px-5 py-7 text-white sm:px-8">
              <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-[#E3C566]">Admin · لوحة التحكم</p>
              <h1 className="mt-1 font-display text-[clamp(24px,3vw,32px)] font-semibold">Welcome back</h1>
              <p className="mt-1 text-[13.5px] text-[#AEBBCC]">{user?.email}</p>
              {stats.pending > 0 && (
                <Link href="/admin/courses" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2.5 text-[13.5px] font-semibold text-[#0A1A30]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#A33025]" /> {stats.pending} student request{stats.pending > 1 ? 's' : ''} waiting · طلبات بانتظار الموافقة
                </Link>
              )}
            </header>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
              {[
                { label: 'Courses', ar: 'المساقات', value: stats.courses, icon: GraduationCap, href: '/admin/courses' },
                { label: 'Students', ar: 'الطلاب', value: stats.students, icon: Users, href: '/admin/courses' },
                { label: 'Pending', ar: 'بانتظار الموافقة', value: stats.pending, icon: Eye, href: '/admin/courses' },
                { label: 'Publications', ar: 'المنشورات', value: stats.publications, icon: FileText, href: '/admin/dashboard?s=publications' },
                { label: 'News', ar: 'الأخبار', value: stats.news, icon: Newspaper, href: '/admin/dashboard?s=news' },
                { label: 'Research areas', ar: 'مجالات البحث', value: stats.interests, icon: BookOpen, href: '/admin/dashboard?s=interests' },
              ].map((stat, i) => {
                const Icon = stat.icon
                return (
                  <Link key={stat.label} href={stat.href} className="card reveal group p-4 transition hover:-translate-y-0.5 hover:border-[#C9A227]/50 sm:p-5" style={{ ['--d' as any]: `${i * 60}ms` }}>
                    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gold-soft text-gold-ink"><Icon size={17} /></span>
                    <p className="font-display text-[28px] font-semibold leading-none text-ink">{stat.value}</p>
                    <p className="mt-1.5 text-[12.5px] text-ink-2">{stat.label} <span className="font-arabic text-muted">· {stat.ar}</span></p>
                  </Link>
                )
              })}
            </div>
            <div className="card p-5 sm:p-6">
              <h2 className="mb-4 text-[15px] font-semibold text-ink">Quick actions <span className="font-arabic text-[13px] font-normal text-muted">· إجراءات سريعة</span></h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: 'Add a lecture / sheet', ar: 'إضافة محاضرة أو شيت', href: '/admin/courses' },
                  { label: 'Add publication', ar: 'إضافة بحث', href: '/admin/dashboard?s=publications' },
                  { label: 'Add news', ar: 'إضافة خبر', href: '/admin/dashboard?s=news' },
                  { label: 'Edit profile', ar: 'تعديل الملف الشخصي', href: '/admin/dashboard?s=profile' },
                  { label: 'Add conference', ar: 'إضافة مؤتمر', href: '/admin/dashboard?s=conferences' },
                  { label: 'Sheet guide & samples', ar: 'دليل الشيتات والأمثلة', href: '/admin/mn-guide' },
                ].map(action => (
                  <Link key={action.label} href={action.href}
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3 text-[13.5px] text-ink transition hover:border-[#C9A227]/60">
                    <Plus size={15} className="text-gold-ink" /> {action.label} <span className="ms-auto font-arabic text-[12px] text-muted">{action.ar}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'profile' && <ProfileSection />}
        {section === 'publications' && <PublicationsSection />}
        {section === 'interests' && <InterestsSection />}
        {section === 'news' && <NewsSection />}
        {section === 'education' && <EducationSection />}
        {section === 'positions' && <PositionsSection />}
        {section === 'awards' && <AwardsSection />}
        {section === 'memberships' && <MembershipsSection />}
        {section === 'committees' && <CommitteesSection />}
        {section === 'conferences' && <ConferencesSection />}
        {section === 'supervision' && <SupervisionSection />}
      </main>
    </div>
  )
}

// ============ PROFILE SECTION ============
function ProfileSection() {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data } = await supabase.from('profile').select('*').single()
      if (data) setData(data)
      setLoading(false)
    }
    fetch()
  }, [])

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const clean = { ...data }
    for (const k of ['citations_total', 'h_index', 'i10_index']) clean[k] = clean[k] === '' || clean[k] == null ? null : Number(clean[k])
    const r = await supabase.from('profile').update({ ...clean, updated_at: new Date().toISOString() }).eq('id', data.id)
    if (r.error) { alert('Save failed: ' + r.error.message); setSaving(false); return }
    revalidateSite()
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function uploadFile(file: File, bucket: string, field: string, setUploading: (v: boolean) => void) {
    setUploading(true)
    try {
      const url = await uploadToR2(file, `public/${bucket}`)
      setData((prev: any) => ({ ...prev, [field]: url }))
    } catch (e: any) {
      alert('Upload failed: ' + e.message)
    }
    setUploading(false)
  }

  if (loading) return <Spinner />

  const fields = [
    { key: 'name_en', label: 'Name (EN)' }, { key: 'name_ar', label: 'Name (AR)' },
    { key: 'title_en', label: 'Title (EN)' }, { key: 'title_ar', label: 'Title (AR)' },
    { key: 'degree_en', label: 'Degree (EN)' }, { key: 'degree_ar', label: 'Degree (AR)' },
    { key: 'university_en', label: 'University (EN)' }, { key: 'university_ar', label: 'University (AR)' },
    { key: 'faculty_en', label: 'Faculty (EN)' }, { key: 'faculty_ar', label: 'Faculty (AR)' },
    { key: 'department_en', label: 'Department (EN)' }, { key: 'department_ar', label: 'Department (AR)' },
    { key: 'specialization_en', label: 'Specialization (EN)' }, { key: 'specialization_ar', label: 'Specialization (AR)' },
    { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
    { key: 'office', label: 'Office' }, { key: 'office_hours', label: 'Office Hours' },
    { key: 'google_scholar_url', label: 'Google Scholar URL' }, { key: 'orcid_url', label: 'ORCID URL' },
    { key: 'researchgate_url', label: 'ResearchGate URL' }, { key: 'linkedin_url', label: 'LinkedIn URL' },
    { key: 'citations_total', label: 'Total citations (Google Scholar) — optional' }, { key: 'h_index', label: 'h-index (Google Scholar) — optional' },
    { key: 'i10_index', label: 'i10-index (Google Scholar) — optional' },
  ]

  return (
    <div>
      <SectionHeader title="Profile" onSave={handleSave} saving={saving} saved={saved} />
      <div className="bg-surface rounded-xl border border-line p-6">

        {/* Photo Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-line">
          <div>
            <label className="block text-ink-2 text-xs mb-2">Profile Photo</label>
            <div className="flex items-center gap-3">
              <img src="/images/prof-avatar.jpg" alt="Profile" className="w-16 h-16 rounded-full border-2 border-[#C9A227] object-cover" />
              <p className="text-ink-2 text-xs leading-relaxed">The portrait is now part of the website code<br/>(<code>public/images/prof-portrait.jpg</code>) for speed.</p>
            </div>
          </div>

          <div>
            <label className="block text-ink-2 text-xs mb-2">CV / Resume (PDF)</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg border-2 border-line bg-surface-2 flex items-center justify-center shrink-0">
                <span className="text-2xl">{data.cv_url ? '📄' : '📋'}</span>
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer bg-navy hover:bg-navy-2 text-white px-3 py-2 rounded-lg text-xs transition-colors w-fit">
                  <Upload size={12} />
                  {uploadingCV ? 'Uploading...' : 'Upload CV (PDF)'}
                  <input type="file" accept=".pdf" className="hidden"
                    onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'cv', 'cv_url', setUploadingCV)} />
                </label>
                {data.cv_url && (
                  <a href={data.cv_url} target="_blank" rel="noopener noreferrer"
                    className="text-link text-xs mt-1 block hover:underline">
                    View current CV ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-ink-2 text-xs mb-1">{f.label}</label>
              <input value={data[f.key] || ''} onChange={e => setData({ ...data, [f.key]: e.target.value })}
                className="w-full border border-line bg-surface text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A227]" />
            </div>
          ))}
        </div>

        {/* Bio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-ink-2 text-xs mb-1">Bio (EN)</label>
            <textarea rows={5} value={data.bio_en || ''} onChange={e => setData({ ...data, bio_en: e.target.value })}
              className="w-full border border-line bg-surface text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A227] resize-none" />
          </div>
          <div>
            <label className="block text-ink-2 text-xs mb-1">Bio (AR)</label>
            <textarea rows={5} value={data.bio_ar || ''} onChange={e => setData({ ...data, bio_ar: e.target.value })}
              dir="rtl" className="w-full border border-line bg-surface text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A227] resize-none font-arabic" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ PUBLICATIONS SECTION ============
function PublicationsSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const empty = {
    title_en: '', authors: '', journal_name: '', year: new Date().getFullYear(),
    volume: '', issue: '', pages: '', abstract_en: '',
    doi: '', scholar_url: '', journal_url: '',
    citation_count: 0, pub_type: 'article', is_featured: false
  }
  const [form, setForm] = useState(empty)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('publications').select('*').order('year', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    const supabase = createClient()
    // only send real columns (the old form sent a removed "keywords" column → every save failed silently)
    const { id, created_at, updated_at, keywords, ...payload } = form as any
    const res = editing
      ? await supabase.from('publications').update(payload).eq('id', editing.id)
      : await supabase.from('publications').insert(payload)
    if (res.error) { alert('Save failed: ' + res.error.message); return }
    revalidateSite()
    setShowForm(false); setEditing(null); setForm(empty); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this publication?')) return
    const supabase = createClient()
    await supabase.from('publications').delete().eq('id', id)
    revalidateSite()
    load()
  }

  function handleEdit(item: any) {
    setEditing(item)
    setForm({ ...item })
    setShowForm(true)
  }

  if (loading) return <Spinner />

  return (
    <div>
      <SectionHeader title={`Publications (${items.length})`} onAdd={() => { setEditing(null); setForm(empty); setShowForm(true) }} />

      {showForm && (
        <div className="bg-surface rounded-xl border border-line p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-ink font-semibold text-sm">{editing ? 'Edit Publication' : 'Add Publication'}</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-muted" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Title (EN) *" value={form.title_en} onChange={v => setForm({ ...form, title_en: v })} />
            <Field label="Authors *" value={form.authors} onChange={v => setForm({ ...form, authors: v })} />
            <Field label="Journal Name" value={form.journal_name} onChange={v => setForm({ ...form, journal_name: v })} />
            <Field label="Year *" value={form.year} onChange={v => setForm({ ...form, year: parseInt(v) })} type="number" />
            <Field label="Volume" value={form.volume} onChange={v => setForm({ ...form, volume: v })} />
            <Field label="Issue" value={form.issue} onChange={v => setForm({ ...form, issue: v })} />
            <Field label="Pages" value={form.pages} onChange={v => setForm({ ...form, pages: v })} />
            <Field label="DOI" value={form.doi} onChange={v => setForm({ ...form, doi: v })} />
            <Field label="Citation Count" value={form.citation_count} onChange={v => setForm({ ...form, citation_count: parseInt(v) })} type="number" />
            <Field label="DOI URL / Journal URL" value={form.journal_url} onChange={v => setForm({ ...form, journal_url: v })} />
            <Field label="Google Scholar URL" value={form.scholar_url} onChange={v => setForm({ ...form, scholar_url: v })} />
            <div>
              <label className="block text-ink-2 text-xs mb-1">Type</label>
              <select value={form.pub_type} onChange={e => setForm({ ...form, pub_type: e.target.value })}
                className="w-full border border-line bg-surface text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A227]">
                {['article', 'conference', 'book', 'chapter', 'thesis', 'other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="featured" checked={form.is_featured}
                onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
              <label htmlFor="featured" className="text-ink-2 text-sm">Featured on Homepage</label>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-ink-2 text-xs mb-1">Abstract (EN)</label>
            <textarea rows={4} value={form.abstract_en} onChange={e => setForm({ ...form, abstract_en: e.target.value })}
              className="w-full border border-line bg-surface text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A227] resize-none" />
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave}
              className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm hover:bg-navy-2 transition-colors">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-2 border border-line text-ink-2 px-4 py-2 rounded-lg text-sm hover:bg-surface-2 transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="bg-surface rounded-xl border border-line p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-ink font-medium text-sm truncate">{item.title_en}</p>
              <p className="text-muted text-xs mt-0.5">{item.authors} · {item.year} · {item.journal_name}</p>
              {item.is_featured && <span className="text-xs text-gold-ink">★ Featured</span>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(item)}
                className="p-1.5 text-muted hover:text-ink hover:bg-surface-2 rounded transition-colors">
                <Edit size={14} />
              </button>
              <button onClick={() => handleDelete(item.id)}
                className="p-1.5 text-muted hover:text-bad hover:bg-bad-soft rounded transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <Empty />}
      </div>
    </div>
  )
}

// ============ GENERIC LIST SECTIONS ============
function GenericSection({ table, title, fields }: { table: string; title: string; fields: any[] }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const empty = fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default ?? '' }), {})
  const [form, setForm] = useState(empty)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from(table).select('*').order('sort_order', { ascending: true })
    if (data) setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    const supabase = createClient()
    if (editing) {
      const { id, created_at, ...rest } = form as any
      const r = await supabase.from(table).update(rest).eq('id', editing.id)
      if (r.error) { alert('Save failed: ' + r.error.message); return }
      revalidateSite()
    } else {
      const r = await supabase.from(table).insert(form)
      if (r.error) { alert('Save failed: ' + r.error.message); return }
      revalidateSite()
    }
    setShowForm(false); setEditing(null); setForm(empty); load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete?')) return
    const supabase = createClient()
    await supabase.from(table).delete().eq('id', id)
    revalidateSite()
    load()
  }

  function handleEdit(item: any) {
    setEditing(item); setForm(item); setShowForm(true)
  }

  const displayField = fields.find(f => f.primary)?.key || fields[0]?.key

  if (loading) return <Spinner />

  return (
    <div>
      <SectionHeader title={`${title} (${items.length})`} onAdd={() => { setEditing(null); setForm(empty); setShowForm(true) }} />

      {showForm && (
        <div className="bg-surface rounded-xl border border-line p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-ink font-semibold text-sm">{editing ? `Edit ${title}` : `Add ${title}`}</h3>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-muted" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(f => (
              f.type === 'textarea' ? (
                <div key={f.key} className={f.full ? 'md:col-span-2' : ''}>
                  <label className="block text-ink-2 text-xs mb-1">{f.label}</label>
                  <textarea rows={3} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    dir={f.dir || 'ltr'}
                    className="w-full border border-line bg-surface text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A227] resize-none" />
                </div>
              ) : f.type === 'checkbox' ? (
                <div key={f.key} className="flex items-center gap-2">
                  <input type="checkbox" id={f.key} checked={!!form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.checked })} />
                  <label htmlFor={f.key} className="text-ink-2 text-sm">{f.label}</label>
                </div>
              ) : f.type === 'select' ? (
                <div key={f.key}>
                  <label className="block text-ink-2 text-xs mb-1">{f.label}</label>
                  <select value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border border-line bg-surface text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A227]">
                    {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ) : (
                <Field key={f.key} label={f.label} value={form[f.key]} type={f.type || 'text'}
                  onChange={v => setForm({ ...form, [f.key]: f.type === 'number' ? parseInt(v) || 0 : v })}
                  dir={f.dir} />
              )
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave}
              className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm hover:bg-navy-2 transition-colors">
              <Save size={14} /> Save
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-2 border border-line text-ink-2 px-4 py-2 rounded-lg text-sm hover:bg-surface-2 transition-colors">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="bg-surface rounded-xl border border-line p-4 flex items-center justify-between gap-4">
            <p className="text-ink text-sm flex-1 min-w-0 truncate">{item[displayField]}</p>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleEdit(item)}
                className="p-1.5 text-muted hover:text-ink hover:bg-surface-2 rounded transition-colors">
                <Edit size={14} />
              </button>
              <button onClick={() => handleDelete(item.id)}
                className="p-1.5 text-muted hover:text-bad hover:bg-bad-soft rounded transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <Empty />}
      </div>
    </div>
  )
}

// ============ SECTION INSTANCES ============
const InterestsSection = () => <GenericSection table="research_interests" title="Research Interests" fields={[
  { key: 'name_en', label: 'Name (EN)', primary: true },
  { key: 'name_ar', label: 'Name (AR)', dir: 'rtl' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const NewsSection = () => <GenericSection table="news_activities" title="News & Activities" fields={[
  { key: 'title_en', label: 'Title (EN)', primary: true },
  { key: 'title_ar', label: 'Title (AR)', dir: 'rtl' },
  { key: 'activity_type', label: 'Type', type: 'select', options: ['news', 'conference', 'award', 'talk', 'workshop', 'other'], default: 'news' },
  { key: 'activity_date', label: 'Date', type: 'date' },
  { key: 'location', label: 'Location' },
  { key: 'external_url', label: 'URL' },
  { key: 'is_featured', label: 'Featured', type: 'checkbox' },
  { key: 'content_en', label: 'Content (EN)', type: 'textarea', full: true },
  { key: 'content_ar', label: 'Content (AR)', type: 'textarea', dir: 'rtl', full: true },
]} />

const EducationSection = () => <GenericSection table="education" title="Education" fields={[
  { key: 'degree_en', label: 'Degree (EN)', primary: true },
  { key: 'degree_ar', label: 'Degree (AR)', dir: 'rtl' },
  { key: 'field_en', label: 'Field (EN)' },
  { key: 'field_ar', label: 'Field (AR)', dir: 'rtl' },
  { key: 'institution_en', label: 'Institution (EN)' },
  { key: 'institution_ar', label: 'Institution (AR)', dir: 'rtl' },
  { key: 'country', label: 'Country' },
  { key: 'year_start', label: 'Year Start', type: 'number' },
  { key: 'year_end', label: 'Year End', type: 'number' },
  { key: 'thesis_title', label: 'Thesis Title' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const PositionsSection = () => <GenericSection table="positions" title="Academic Positions" fields={[
  { key: 'title_en', label: 'Title (EN)', primary: true },
  { key: 'title_ar', label: 'Title (AR)', dir: 'rtl' },
  { key: 'institution_en', label: 'Institution (EN)' },
  { key: 'institution_ar', label: 'Institution (AR)', dir: 'rtl' },
  { key: 'department_en', label: 'Department (EN)' },
  { key: 'department_ar', label: 'Department (AR)', dir: 'rtl' },
  { key: 'year_start', label: 'Year Start', type: 'number' },
  { key: 'year_end', label: 'Year End', type: 'number' },
  { key: 'is_current', label: 'Current Position', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const AwardsSection = () => <GenericSection table="awards" title="Awards" fields={[
  { key: 'title_en', label: 'Title (EN)', primary: true },
  { key: 'title_ar', label: 'Title (AR)', dir: 'rtl' },
  { key: 'organization_en', label: 'Organization (EN)' },
  { key: 'organization_ar', label: 'Organization (AR)', dir: 'rtl' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'description_en', label: 'Description (EN)', type: 'textarea' },
  { key: 'description_ar', label: 'Description (AR)', type: 'textarea', dir: 'rtl' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const MembershipsSection = () => <GenericSection table="memberships" title="Memberships" fields={[
  { key: 'organization_en', label: 'Organization (EN)', primary: true },
  { key: 'organization_ar', label: 'Organization (AR)', dir: 'rtl' },
  { key: 'role_en', label: 'Role (EN)' },
  { key: 'role_ar', label: 'Role (AR)', dir: 'rtl' },
  { key: 'year_start', label: 'Year Start', type: 'number' },
  { key: 'year_end', label: 'Year End', type: 'number' },
  { key: 'is_current', label: 'Currently Active', type: 'checkbox', default: true },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const CommitteesSection = () => <GenericSection table="committees" title="Committees" fields={[
  { key: 'name_en', label: 'Committee Name (EN)', primary: true },
  { key: 'name_ar', label: 'Committee Name (AR)', dir: 'rtl' },
  { key: 'role_en', label: 'Role (EN)' },
  { key: 'role_ar', label: 'Role (AR)', dir: 'rtl' },
  { key: 'institution_en', label: 'Institution (EN)' },
  { key: 'institution_ar', label: 'Institution (AR)', dir: 'rtl' },
  { key: 'year_start', label: 'Year Start', type: 'number' },
  { key: 'year_end', label: 'Year End', type: 'number' },
  { key: 'is_current', label: 'Current', type: 'checkbox' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const ConferencesSection = () => <GenericSection table="conferences" title="Conferences" fields={[
  { key: 'name_en', label: 'Conference Name (EN)', primary: true },
  { key: 'name_ar', label: 'Conference Name (AR)', dir: 'rtl' },
  { key: 'role', label: 'Role', type: 'select', options: ['presenter', 'keynote', 'organizer', 'reviewer', 'attendee'], default: 'presenter' },
  { key: 'paper_title', label: 'Paper Title' },
  { key: 'location', label: 'Location' },
  { key: 'country', label: 'Country' },
  { key: 'year', label: 'Year', type: 'number' },
  { key: 'url', label: 'URL' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const SupervisionSection = () => <GenericSection table="supervision" title="Supervision" fields={[
  { key: 'student_name', label: 'Student Name (EN)', primary: true },
  { key: 'student_name_ar', label: 'اسم الطالب (عربي)', dir: 'rtl' },
  { key: 'degree_level', label: 'Degree Level', type: 'select', options: ['masters', 'phd', 'postdoc'], default: 'phd' },
  { key: 'thesis_title_en', label: 'Thesis Title (EN)' },
  { key: 'thesis_title_ar', label: 'Thesis Title (AR)', dir: 'rtl' },
  { key: 'institution', label: 'Institution (EN)' },
  { key: 'institution_ar', label: 'المؤسسة (عربي)', dir: 'rtl' },
  { key: 'year_start', label: 'Year Start', type: 'number' },
  { key: 'year_end', label: 'Year End', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['ongoing', 'completed', 'withdrawn'], default: 'ongoing' },
  { key: 'co_supervisor', label: 'Co-Supervisor (EN)' },
  { key: 'co_supervisor_ar', label: 'المشرف المشارك (عربي)', dir: 'rtl' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

// ============ SHARED COMPONENTS ============
function SectionHeader({ title, onAdd, onSave, saving, saved }: any) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-ink text-xl font-bold font-display">{title}</h1>
      <div className="flex gap-2">
        {onAdd && (
          <button onClick={onAdd}
            className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg text-sm hover:bg-navy-2 transition-colors">
            <Plus size={14} /> Add New
          </button>
        )}
        {onSave && (
          <button onClick={onSave} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              saved ? 'bg-ok-soft0 text-white' : 'bg-[#C9A227] hover:bg-[#E0BC4A] text-[#0A1A30]'
            }`}>
            <Save size={14} /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', dir }: any) {
  return (
    <div>
      <label className="block text-ink-2 text-xs mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} dir={dir}
        className="w-full border border-line bg-surface text-ink rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A227] transition-colors" />
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-navy border-t-[#C9A84C] rounded-full animate-spin" />
    </div>
  )
}

function Empty() {
  return <p className="text-center text-muted text-sm py-8">No items yet. Click "Add New" to get started.</p>
}