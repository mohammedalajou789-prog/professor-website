// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, BookOpen, Newspaper, User, GraduationCap, Award, Users, Globe, Plus, Edit, Trash2, Save, X, Upload,
  Briefcase, Mic, UserCheck, School, Sigma, Hourglass, Star, CalendarDays, MapPin, ArrowUpRight, Search, Check, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { uploadToR2, revalidateSite } from '@/lib/admin-client'
import { AdminHero } from '@/components/admin/ui'
import MathField from '@/components/motion/MathField'

/** in-memory cache: switching sections shows the last data instantly, then refreshes in the background */
const MEM: Record<string, any> = {}

type Section = 'overview' | 'profile' | 'publications' | 'news' | 'education' |
  'positions' | 'awards' | 'memberships' | 'committees' | 'conferences' | 'supervision' | 'interests'

/** publication status: published, or one of the "ongoing" stages (shown on the site as Ongoing research) */
const PUB_STATUS = [
  { id: 'published', label: 'Published', ar: 'منشور' },
  { id: 'accepted', label: 'Accepted · in press', ar: 'مقبول للنشر' },
  { id: 'under_review', label: 'Under review', ar: 'قيد التحكيم' },
  { id: 'in_preparation', label: 'In preparation', ar: 'قيد الإعداد' },
]

const CONTENT = [
  { id: 'profile', label: 'Profile', ar: 'الملف الشخصي', icon: User, tone: '#0B6FA4', glyph: 'α' },
  { id: 'publications', label: 'Publications', ar: 'المنشورات', icon: FileText, tone: '#C9A227', glyph: '∫' },
  { id: 'interests', label: 'Research areas', ar: 'مجالات البحث', icon: BookOpen, tone: '#7D3C98', glyph: 'Σ' },
  { id: 'news', label: 'News & activities', ar: 'الأخبار', icon: Newspaper, tone: '#D35400', glyph: '★' },
  { id: 'education', label: 'Education', ar: 'التعليم', icon: GraduationCap, tone: '#0E7C6B', glyph: 'Γ' },
  { id: 'positions', label: 'Positions', ar: 'المناصب', icon: Briefcase, tone: '#1F5FAD', glyph: '∂' },
  { id: 'awards', label: 'Awards', ar: 'الجوائز', icon: Award, tone: '#B7950B', glyph: '♛' },
  { id: 'memberships', label: 'Memberships', ar: 'العضويات', icon: Globe, tone: '#117A65', glyph: '∈' },
  { id: 'committees', label: 'Committees', ar: 'اللجان', icon: Users, tone: '#5D6D7E', glyph: '∩' },
  { id: 'conferences', label: 'Conferences', ar: 'المؤتمرات', icon: Mic, tone: '#A93226', glyph: 'λ' },
  { id: 'supervision', label: 'Supervision', ar: 'الإشراف', icon: UserCheck, tone: '#2E86C1', glyph: '∇' },
]
const META = Object.fromEntries(CONTENT.map((c) => [c.id, c]))

export default function DashboardPage() {
  const sp = useSearchParams()
  const section = (sp.get('s') || 'overview') as Section
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState(MEM.stats || null)
  const [latest, setLatest] = useState<any[]>(MEM.latest || [])
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user ?? null
      if (!user && process.env.NEXT_PUBLIC_ADMIN_PREVIEW !== '1') { router.push('/login'); return }
      setUser(user)
      if (section !== 'overview') return
      const head = { count: 'exact', head: true }
      const [pub, ongoing, news, interests, courses, lectures, students, recent] = await Promise.all([
        supabase.from('publications').select('id', head),
        supabase.from('publications').select('id', head).neq('status', 'published'),
        supabase.from('news_activities').select('id', head),
        supabase.from('research_interests').select('id', head),
        supabase.from('courses').select('id', head),
        supabase.from('lectures').select('id', head),
        supabase.from('students').select('id', head),
        supabase.from('news_activities').select('id, title_en, title_ar, activity_type, activity_date, is_featured').order('activity_date', { ascending: false, nullsFirst: false }).limit(4),
      ])
      setStats(MEM.stats = {
        publications: pub.count || 0,
        ongoing: ongoing.error ? 0 : ongoing.count || 0,
        news: news.count || 0,
        interests: interests.count || 0,
        courses: courses.count || 0,
        lectures: lectures.count || 0,
        students: students.count || 0,
      })
      setLatest(MEM.latest = recent.data || [])
    }
    init()
  }, [section])

  return (
    <div className="min-w-0 p-3 sm:p-5 lg:p-7">
      {section === 'overview' && <Overview user={user} stats={stats} latest={latest} />}
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
    </div>
  )
}

// ============ OVERVIEW ============
function Overview({ user, stats, latest }: any) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])
  const h = now?.getHours() ?? 12
  const greet = h < 12 ? ['Good morning', 'صباح الخير'] : h < 18 ? ['Good afternoon', 'نهارك سعيد'] : ['Good evening', 'مساء الخير']
  const tiles = [
    { label: 'Courses', ar: 'المساقات', key: 'courses', icon: School, tone: '#1F5FAD', glyph: 'Σ', href: '/admin/courses' },
    { label: 'Lectures', ar: 'المحاضرات', key: 'lectures', icon: BookOpen, tone: '#0B6FA4', glyph: '∫', href: '/admin/courses' },
    { label: 'Students', ar: 'الطلاب', key: 'students', icon: Users, tone: '#0E7C6B', glyph: '∀', href: '/admin/courses' },
    { label: 'Publications', ar: 'المنشورات', key: 'publications', icon: FileText, tone: '#C9A227', glyph: '∂', href: '/admin/dashboard?s=publications' },
    { label: 'Ongoing', ar: 'أبحاث جارية', key: 'ongoing', icon: Hourglass, tone: '#7D3C98', glyph: '…', href: '/admin/dashboard?s=publications' },
    { label: 'News', ar: 'الأخبار', key: 'news', icon: Newspaper, tone: '#D35400', glyph: '★', href: '/admin/dashboard?s=news' },
  ]
  const actions = [
    { label: 'Add a lecture / sheet', ar: 'إضافة محاضرة أو شيت', href: '/admin/courses', icon: BookOpen, tone: '#0B6FA4' },
    { label: 'Add publication', ar: 'إضافة بحث', href: '/admin/dashboard?s=publications&new=1', icon: FileText, tone: '#C9A227' },
    { label: 'Add ongoing research', ar: 'إضافة بحث جارٍ', href: '/admin/dashboard?s=publications&new=ongoing', icon: Hourglass, tone: '#7D3C98' },
    { label: 'Add news', ar: 'إضافة خبر', href: '/admin/dashboard?s=news&new=1', icon: Newspaper, tone: '#D35400' },
    { label: 'Edit profile', ar: 'تعديل الملف الشخصي', href: '/admin/dashboard?s=profile', icon: User, tone: '#1F5FAD' },
    { label: 'Sheet guide & samples', ar: 'دليل الشيتات', href: '/admin/mn-guide', icon: Sigma, tone: '#0E7C6B' },
  ]
  return (
    <div className="space-y-6">
      <header className="admin-hero page-enter relative overflow-hidden rounded-2xl px-5 py-7 text-white sm:px-8 sm:py-9">
        <MathField variant="spiral" className="absolute inset-0 h-full w-full opacity-40" density={0.5} />
        <span aria-hidden className="pointer-events-none absolute -bottom-14 end-6 select-none font-display text-[200px] italic leading-none text-white/[.06]">∫</span>
        <div className="relative">
          <p className="text-[12px] font-semibold uppercase tracking-[.16em] text-[#E3C566]">{now ? now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Admin'}</p>
          <h1 className="mt-2 font-display text-[clamp(26px,3.4vw,38px)] font-semibold leading-tight">{greet[0]}, Doctor <span className="font-arabic text-[clamp(18px,2.2vw,24px)] font-normal text-[#C4CFDE]">· {greet[1]} يا دكتور</span></h1>
          <p className="mt-1.5 text-[13.5px] text-[#AEBBCC]">{user?.email || 'Prof. Ahmad El-Ajou'}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href="/admin/courses" className="inline-flex items-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2.5 text-[13.5px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A]"><BookOpen size={16} /> Courses & lectures</Link>
            <Link href="/admin/dashboard?s=publications&new=1" className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-4 py-2.5 text-[13.5px] text-white transition hover:border-[#C9A227]"><Plus size={16} /> Publication</Link>
            <Link href="/admin/dashboard?s=news&new=1" className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-4 py-2.5 text-[13.5px] text-white transition hover:border-[#C9A227]"><Plus size={16} /> News</Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t, i) => {
          const Icon = t.icon
          return (
            <Link key={t.key} href={t.href} className="admin-tile reveal p-4 sm:p-5" style={{ ['--tile' as any]: t.tone, ['--d' as any]: `${i * 60}ms` }}>
              <span className="glyph">{t.glyph}</span>
              <span className="admin-chip mb-3 h-10 w-10"><Icon size={18} /></span>
              <p className="font-display text-[30px] font-semibold leading-none text-ink">{stats ? stats[t.key] : <span className="inline-block h-7 w-10 animate-pulse rounded bg-surface-3" />}</p>
              <p className="mt-1.5 text-[12.5px] text-ink-2">{t.label} <span className="font-arabic text-muted">· {t.ar}</span></p>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="card reveal overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-5 py-3">
            <Newspaper size={16} className="text-[#D35400]" />
            <h2 className="text-[14.5px] font-semibold text-ink">Latest news on the home page <span className="font-arabic text-[12.5px] font-normal text-muted">· آخر الأخبار في الصفحة الرئيسية</span></h2>
            <Link href="/admin/dashboard?s=news" className="ms-auto text-[12.5px] font-semibold text-link hover:underline">Manage</Link>
          </div>
          {latest.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-display text-[40px] italic text-[#C9A227]">∅</p>
              <p className="text-[13.5px] text-muted">No news yet — the home page shows nothing in “Latest news”.</p>
              <Link href="/admin/dashboard?s=news&new=1" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-[13px] text-white"><Plus size={14} /> Add news</Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {latest.map((n: any) => (
                <li key={n.id}>
                  <Link href={`/admin/dashboard?s=news&edit=${n.id}`} className="group flex items-start gap-3 px-5 py-3.5 transition hover:bg-surface-2">
                    <span className="admin-chip mt-0.5 h-9 w-9 shrink-0" style={{ ['--tile' as any]: '#D35400' }}><Newspaper size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">{n.title_en}</span>
                      <span className="mt-0.5 flex flex-wrap gap-2 text-[11.5px] text-muted">
                        {n.activity_type && <span className="rounded-full bg-gold-soft px-2 text-gold-ink">{n.activity_type}</span>}
                        {n.activity_date && <span>{new Date(n.activity_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        {n.is_featured && <span className="text-gold-ink">★ featured</span>}
                      </span>
                    </span>
                    <Edit size={14} className="mt-1 text-muted transition group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card reveal p-5">
          <h2 className="mb-3.5 text-[14.5px] font-semibold text-ink">Quick actions <span className="font-arabic text-[12.5px] font-normal text-muted">· إجراءات سريعة</span></h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {actions.map((a) => {
              const Icon = a.icon
              return (
                <Link key={a.label} href={a.href} className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3.5 py-3 transition hover:-translate-y-0.5 hover:border-[var(--tile)] hover:bg-surface" style={{ ['--tile' as any]: a.tone }}>
                  <span className="admin-chip h-9 w-9 shrink-0"><Icon size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink">{a.label}</span>
                    <span className="block truncate font-arabic text-[11.5px] text-muted">{a.ar}</span>
                  </span>
                  <ArrowUpRight size={15} className="text-muted transition group-hover:text-ink" />
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[.14em] text-muted">Website content · <span className="font-arabic normal-case tracking-normal">محتوى الموقع</span></h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {CONTENT.map((c, i) => {
            const Icon = c.icon
            return (
              <Link key={c.id} href={`/admin/dashboard?s=${c.id}`} className="admin-tile reveal flex items-center gap-3 p-3.5" style={{ ['--tile' as any]: c.tone, ['--d' as any]: `${(i % 6) * 50}ms` }}>
                <span className="glyph !text-[80px]">{c.glyph}</span>
                <span className="admin-chip h-9 w-9 shrink-0"><Icon size={16} /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{c.label}</span>
                  <span className="block truncate font-arabic text-[11.5px] text-muted">{c.ar}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

// ============ PROFILE SECTION ============
function ProfileSection() {
  const [data, setData] = useState<any>(MEM.profile || {})
  const [loading, setLoading] = useState(!MEM.profile)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingCV, setUploadingCV] = useState(false)

  useEffect(() => {
    async function fetch() {
      const supabase = createClient()
      const { data } = await supabase.from('profile').select('*').single()
      if (data) setData(MEM.profile = data)
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

  const groups = [
    { title: 'Name & title', ar: 'الاسم واللقب', fields: [['name_en', 'Name (EN)'], ['name_ar', 'Name (AR)'], ['title_en', 'Title (EN)'], ['title_ar', 'Title (AR)'], ['degree_en', 'Degree (EN)'], ['degree_ar', 'Degree (AR)']] },
    { title: 'University', ar: 'الجامعة', fields: [['university_en', 'University (EN)'], ['university_ar', 'University (AR)'], ['faculty_en', 'Faculty (EN)'], ['faculty_ar', 'Faculty (AR)'], ['department_en', 'Department (EN)'], ['department_ar', 'Department (AR)'], ['specialization_en', 'Specialization (EN)'], ['specialization_ar', 'Specialization (AR)']] },
    { title: 'Contact', ar: 'التواصل', fields: [['email', 'Email'], ['phone', 'Phone'], ['office', 'Office'], ['office_hours', 'Office Hours']] },
    { title: 'Academic profiles & metrics', ar: 'الحسابات الأكاديمية والمؤشرات', fields: [['google_scholar_url', 'Google Scholar URL'], ['orcid_url', 'ORCID URL'], ['researchgate_url', 'ResearchGate URL'], ['linkedin_url', 'LinkedIn URL'], ['citations_total', 'Total citations (optional)'], ['h_index', 'h-index (optional)'], ['i10_index', 'i10-index (optional)']] },
  ]

  return (
    <div className="space-y-5">
      <SectionHero id="profile" title="Profile" onSave={handleSave} saving={saving} saved={saved} />
      {loading ? <Spinner /> : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card flex items-center gap-4 p-5">
              <img src="/images/prof-avatar.jpg" alt="Profile" className="h-16 w-16 rounded-full border-2 border-[#C9A227] object-cover" />
              <p className="text-[12.5px] leading-relaxed text-ink-2">The portrait is part of the website code (<code>public/images/prof-portrait.jpg</code>) for speed.</p>
            </div>
            <div className="card flex items-center gap-4 p-5">
              <span className="admin-chip h-14 w-14 shrink-0" style={{ ['--tile' as any]: '#A93226' }}><FileText size={22} /></span>
              <div className="flex-1">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-navy px-3.5 py-2 text-[13px] text-white transition-colors hover:bg-navy-2">
                  <Upload size={13} /> {uploadingCV ? 'Uploading…' : 'Upload CV (PDF)'}
                  <input type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'cv', 'cv_url', setUploadingCV)} />
                </label>
                {data.cv_url && <a href={data.cv_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 block text-[12.5px] text-link hover:underline">View current CV ↗</a>}
              </div>
            </div>
          </div>
          {groups.map((g) => (
            <FormCard key={g.title} title={g.title} ar={g.ar}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {g.fields.map(([k, label]) => (
                  <Field key={k} label={label} value={data[k]} dir={k.endsWith('_ar') ? 'rtl' : undefined} onChange={(v) => setData({ ...data, [k]: v })} />
                ))}
              </div>
            </FormCard>
          ))}
          <FormCard title="Biography" ar="السيرة المختصرة">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Area label="Bio (EN)" value={data.bio_en} onChange={(v) => setData({ ...data, bio_en: v })} rows={6} />
              <Area label="Bio (AR)" value={data.bio_ar} onChange={(v) => setData({ ...data, bio_ar: v })} rows={6} dir="rtl" />
            </div>
          </FormCard>
          <div className="flex justify-end"><SaveBtn onClick={handleSave} saving={saving} saved={saved} /></div>
        </>
      )}
    </div>
  )
}

// ============ PUBLICATIONS SECTION ============
function PublicationsSection() {
  const sp = useSearchParams()
  const [items, setItems] = useState<any[]>(MEM.publications || [])
  const [loading, setLoading] = useState(!MEM.publications)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'ongoing'>('all')
  const empty = {
    title_en: '', authors: '', journal_name: '', year: new Date().getFullYear(),
    volume: '', issue: '', pages: '', abstract_en: '',
    doi: '', scholar_url: '', journal_url: '',
    citation_count: 0, pub_type: 'article', is_featured: false, status: 'published',
  }
  const [form, setForm] = useState(empty)

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('publications').select('*').order('year', { ascending: false })
    if (data) setItems(MEM.publications = data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const n = sp.get('new')
    if (n) { setEditing(null); setForm({ ...empty, status: n === 'ongoing' ? 'under_review' : 'published' }); setShowForm(true) }
  }, [sp])

  async function handleSave() {
    if (!form.title_en?.trim() || !form.authors?.trim()) return alert('Title and authors are required.')
    setBusy(true)
    const supabase = createClient()
    // only send real columns (the old form sent a removed "keywords" column → every save failed silently)
    const { id, created_at, updated_at, keywords, ...payload } = form as any
    payload.year = Number(payload.year) || new Date().getFullYear()
    payload.citation_count = Number(payload.citation_count) || 0
    let res = editing
      ? await supabase.from('publications').update(payload).eq('id', editing.id)
      : await supabase.from('publications').insert(payload)
    // the "status" column arrives with sql/004 — before that, save without it
    if (res.error && /status/.test(res.error.message) && payload.status === 'published') {
      const { status, ...rest } = payload
      res = editing ? await supabase.from('publications').update(rest).eq('id', editing.id) : await supabase.from('publications').insert(rest)
    }
    setBusy(false)
    if (res.error) {
      alert(/status/.test(res.error.message) ? 'Run sql/004_open_courses_ongoing.sql in Supabase first (adds the Ongoing option).\n\n' + res.error.message : 'Save failed: ' + res.error.message)
      return
    }
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
    setForm({ ...empty, ...item, status: item.status || 'published' })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isOngoing = (p: any) => p.status && p.status !== 'published'
  const ql = q.toLowerCase()
  const shown = items.filter((p) => (filter === 'all' || (filter === 'ongoing' ? isOngoing(p) : !isOngoing(p))) && (!ql || [p.title_en, p.authors, p.journal_name, String(p.year)].some((x) => x?.toLowerCase().includes(ql))))
  const ongoingCount = items.filter(isOngoing).length
  const ongoingForm = form.status && form.status !== 'published'

  return (
    <div className="space-y-5">
      <SectionHero id="publications" title="Publications" count={items.length} onAdd={() => { setEditing(null); setForm(empty); setShowForm(true) }} extra={
        <button onClick={() => { setEditing(null); setForm({ ...empty, status: 'under_review' }); setShowForm(true) }} className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-3.5 py-2.5 text-[13.5px] text-white transition hover:border-[#C9A227]">
          <Hourglass size={14} /> Add ongoing
        </button>
      } />

      {showForm && (
        <FormCard title={editing ? 'Edit publication' : ongoingForm ? 'New ongoing research' : 'New publication'} ar={ongoingForm ? 'بحث جارٍ (لم يُنشر بعد)' : 'بحث منشور'} onClose={() => setShowForm(false)}>
          <div className="mb-4">
            <p className="mb-1.5 text-[12.5px] font-medium text-ink-2">Status · الحالة</p>
            <div className="flex flex-wrap gap-2">
              {PUB_STATUS.map((st) => (
                <button key={st.id} type="button" onClick={() => setForm({ ...form, status: st.id })} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition ${form.status === st.id ? (st.id === 'published' ? 'border-[#0E7C6B] bg-ok-soft font-semibold text-ok' : 'border-[#7D3C98] bg-[#7D3C98]/10 font-semibold text-[#7D3C98]') : 'border-line text-ink-2 hover:border-[#C9A227]'}`}>
                  {form.status === st.id && <Check size={13} />} {st.label} <span className="font-arabic text-[11.5px] opacity-70">{st.ar}</span>
                </button>
              ))}
            </div>
            {ongoingForm && <p className="mt-2 text-[12px] text-muted">Shown on the Publications page under “Ongoing research”. Journal, volume and DOI are optional. · <span className="font-arabic">يظهر في صفحة المنشورات تحت «أبحاث جارية».</span></p>}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Title (EN) *" value={form.title_en} onChange={(v) => setForm({ ...form, title_en: v })} />
            <Field label="Authors *" value={form.authors} onChange={(v) => setForm({ ...form, authors: v })} />
            <Field label={ongoingForm ? 'Target journal (optional)' : 'Journal name'} value={form.journal_name} onChange={(v) => setForm({ ...form, journal_name: v })} />
            <Field label="Year *" value={form.year} onChange={(v) => setForm({ ...form, year: v })} type="number" />
            {!ongoingForm && (
              <>
                <Field label="Volume" value={form.volume} onChange={(v) => setForm({ ...form, volume: v })} />
                <Field label="Issue" value={form.issue} onChange={(v) => setForm({ ...form, issue: v })} />
                <Field label="Pages" value={form.pages} onChange={(v) => setForm({ ...form, pages: v })} />
                <Field label="Citation count" value={form.citation_count} onChange={(v) => setForm({ ...form, citation_count: v })} type="number" />
              </>
            )}
            <Field label="DOI" value={form.doi} onChange={(v) => setForm({ ...form, doi: v })} />
            <Field label="DOI URL / Journal URL" value={form.journal_url} onChange={(v) => setForm({ ...form, journal_url: v })} />
            <Field label="Google Scholar URL" value={form.scholar_url} onChange={(v) => setForm({ ...form, scholar_url: v })} />
            {!ongoingForm && (
              <label className="flex items-center gap-2.5 self-end rounded-lg border border-line px-3 py-2.5 text-[13.5px] text-ink-2">
                <input type="checkbox" checked={!!form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> ★ Featured on the home page
              </label>
            )}
          </div>
          <div className="mt-4"><Area label="Abstract (EN)" value={form.abstract_en} onChange={(v) => setForm({ ...form, abstract_en: v })} rows={4} /></div>
          <FormButtons onSave={handleSave} onCancel={() => setShowForm(false)} busy={busy} />
        </FormCard>
      )}

      <div className="card flex flex-wrap items-center gap-2 p-3">
        {([['all', `All (${items.length})`], ['published', `Published (${items.length - ongoingCount})`], ['ongoing', `Ongoing (${ongoingCount})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${filter === id ? 'bg-navy text-white' : 'bg-surface-2 text-ink-2 hover:text-ink'}`}>{label}</button>
        ))}
        <SearchBox q={q} setQ={setQ} />
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-2.5">
          {shown.map((item, i) => {
            const st = PUB_STATUS.find((s) => s.id === (item.status || 'published'))
            const on = isOngoing(item)
            return (
              <div key={item.id} className="reveal group relative flex items-start gap-3.5 overflow-hidden rounded-xl border border-line bg-surface p-4 shadow-[var(--c-shadow)] transition hover:border-[#C9A227]/50" style={{ ['--d' as any]: `${Math.min(i, 8) * 30}ms` }}>
                <span className={`absolute inset-y-0 start-0 w-[3px] ${on ? 'bg-[#7D3C98]' : 'bg-gradient-to-b from-[#C9A227] to-[#12A4D9]'}`} />
                <span className={`flex h-11 w-12 shrink-0 flex-col items-center justify-center rounded-lg ${on ? 'bg-[#7D3C98]/10 text-[#7D3C98]' : 'bg-gold-soft text-gold-ink'}`}>
                  {on ? <Hourglass size={16} /> : <span className="font-display text-[15px] font-semibold">{item.year}</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-snug text-ink">{item.title_en}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">{item.authors}{item.journal_name ? ` · ${item.journal_name}` : ''}{on ? ` · ${item.year}` : ''}</p>
                  <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11.5px]">
                    {on && <span className="rounded-full bg-[#7D3C98]/10 px-2 py-0.5 font-medium text-[#7D3C98]">Ongoing · {st?.label}</span>}
                    {item.is_featured && !on && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-gold-ink"><Star size={10} className="me-0.5 inline" />Featured</span>}
                    {!!item.citation_count && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-ink-2">{item.citation_count} citations</span>}
                  </p>
                </div>
                <RowActions onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} />
              </div>
            )
          })}
          {shown.length === 0 && <Empty />}
        </div>
      )}
    </div>
  )
}

// ============ GENERIC LIST SECTIONS ============
function GenericSection({ table, id, fields, order = [{ col: 'sort_order', asc: true }] }: { table: string; id: string; fields: any[]; order?: { col: string; asc?: boolean }[] }) {
  const sp = useSearchParams()
  const [items, setItems] = useState<any[]>(MEM[table] || [])
  const [loading, setLoading] = useState(!MEM[table])
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [q, setQ] = useState('')
  const empty = fields.reduce((acc, f) => ({ ...acc, [f.key]: f.default ?? (f.type === 'checkbox' ? false : '') }), {})
  const [form, setForm] = useState(empty)
  const meta = META[id]

  async function load() {
    const supabase = createClient()
    let query = supabase.from(table).select('*')
    for (const o of order) query = query.order(o.col, { ascending: o.asc ?? true, nullsFirst: false })
    let { data, error } = await query
    // a missing sort column must never hide the items (this is why News looked empty before)
    if (error) ({ data, error } = await supabase.from(table).select('*'))
    if (error) setError(error.message)
    if (data) { setItems(MEM[table] = data); setError('') }
    setLoading(false)
    return data || []
  }

  useEffect(() => {
    load().then((data) => {
      const e = sp.get('edit')
      const hit = e && data.find((x) => x.id === e)
      if (hit) handleEdit(hit)
      else if (sp.get('new')) { setEditing(null); setForm(empty); setShowForm(true) }
    })
  }, [table])

  function clean(obj: any) {
    const out: any = {}
    for (const f of fields) {
      let v = obj[f.key]
      if (f.type === 'number') v = v === '' || v == null ? null : Number(v)
      else if (f.type === 'date') v = v || null
      else if (f.type === 'checkbox') v = !!v
      out[f.key] = v
    }
    return out
  }

  async function handleSave() {
    setBusy(true)
    const supabase = createClient()
    const r = editing ? await supabase.from(table).update(clean(form)).eq('id', editing.id) : await supabase.from(table).insert(clean(form))
    setBusy(false)
    if (r.error) { alert('Save failed: ' + r.error.message); return }
    revalidateSite()
    setShowForm(false); setEditing(null); setForm(empty); load()
  }

  async function handleDelete(rowId: string) {
    if (!confirm('Delete this item?')) return
    const supabase = createClient()
    await supabase.from(table).delete().eq('id', rowId)
    revalidateSite()
    load()
  }

  function handleEdit(item: any) {
    setEditing(item)
    setForm({ ...empty, ...item, ...(fields.some((f) => f.type === 'date') ? Object.fromEntries(fields.filter((f) => f.type === 'date').map((f) => [f.key, (item[f.key] || '').slice(0, 10)])) : {}) })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const primary = fields.find((f) => f.primary)?.key || fields[0]?.key
  const secondary = fields.find((f) => f.dir === 'rtl' && f.key !== primary)?.key
  const subs = fields.filter((f) => f.sub)
  const ql = q.toLowerCase()
  const shown = items.filter((it) => !ql || fields.some((f) => String(it[f.key] ?? '').toLowerCase().includes(ql)))

  return (
    <div className="space-y-5">
      <SectionHero id={id} title={meta.label} count={items.length} onAdd={() => { setEditing(null); setForm(empty); setShowForm(true) }} />

      {showForm && (
        <FormCard title={editing ? `Edit · ${meta.label}` : `New · ${meta.label}`} ar={meta.ar} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {fields.map((f) =>
              f.type === 'textarea' ? (
                <div key={f.key} className={f.full ? 'md:col-span-2' : ''}>
                  <Area label={f.label} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} dir={f.dir} />
                </div>
              ) : f.type === 'checkbox' ? (
                <label key={f.key} className="flex items-center gap-2.5 self-end rounded-lg border border-line px-3 py-2.5 text-[13.5px] text-ink-2">
                  <input type="checkbox" checked={!!form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })} /> {f.label}
                </label>
              ) : f.type === 'select' ? (
                <div key={f.key}>
                  <span className="mb-1 block text-[12.5px] font-medium text-ink-2">{f.label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {f.options.map((o: string) => (
                      <button key={o} type="button" onClick={() => setForm({ ...form, [f.key]: o })} className={`rounded-full border px-3 py-1.5 text-[12.5px] capitalize transition ${form[f.key] === o ? 'border-[#C9A227] bg-gold-soft font-semibold text-gold-ink' : 'border-line text-ink-2 hover:border-[#C9A227]/60'}`}>{o}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <Field key={f.key} label={f.label} value={form[f.key]} type={f.type || 'text'} onChange={(v) => setForm({ ...form, [f.key]: v })} dir={f.dir} />
              )
            )}
          </div>
          <FormButtons onSave={handleSave} onCancel={() => setShowForm(false)} busy={busy} />
        </FormCard>
      )}

      {items.length > 5 && <div className="card flex p-3"><SearchBox q={q} setQ={setQ} /></div>}
      {error && <p className="rounded-xl bg-bad-soft p-3 text-[13px] text-bad">Could not load: {error}</p>}

      {loading ? <Spinner /> : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {shown.map((item, i) => (
            <div key={item.id} className="reveal group relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-line bg-surface p-3.5 shadow-[var(--c-shadow)] transition hover:border-[var(--tile)]" style={{ ['--tile' as any]: meta.tone, ['--d' as any]: `${Math.min(i, 8) * 30}ms` }}>
              <span className="admin-chip h-10 w-10 shrink-0 font-display text-[15px] italic">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">{item[primary] || <span className="text-muted">(no title)</span>}</p>
                {secondary && item[secondary] && <p className="truncate font-arabic text-[12.5px] text-muted"><bdi dir="rtl">{item[secondary]}</bdi></p>}
                {subs.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1.5 text-[11.5px]">
                    {subs.map((f) => {
                      const v = item[f.key]
                      if (v == null || v === '' || v === false) return null
                      const txt = f.type === 'date' ? new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : f.type === 'checkbox' ? f.label : String(v)
                      const Icon = f.type === 'date' ? CalendarDays : f.key === 'location' ? MapPin : f.type === 'checkbox' ? Star : null
                      return <span key={f.key} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 capitalize text-ink-2">{Icon && <Icon size={10} />}{txt}</span>
                    })}
                  </p>
                )}
              </div>
              <RowActions onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} />
            </div>
          ))}
          {shown.length === 0 && !error && <div className="lg:col-span-2"><Empty /></div>}
        </div>
      )}
    </div>
  )
}

// ============ SECTION INSTANCES ============
const InterestsSection = () => <GenericSection table="research_interests" id="interests" fields={[
  { key: 'name_en', label: 'Name (EN)', primary: true },
  { key: 'name_ar', label: 'Name (AR)', dir: 'rtl' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

// News has no sort_order column → newest first by date (this ordering bug made the admin list look empty)
const NewsSection = () => <GenericSection table="news_activities" id="news" order={[{ col: 'activity_date', asc: false }, { col: 'created_at', asc: false }]} fields={[
  { key: 'title_en', label: 'Title (EN)', primary: true },
  { key: 'title_ar', label: 'Title (AR)', dir: 'rtl' },
  { key: 'activity_type', label: 'Type', type: 'select', options: ['news', 'award', 'conference', 'talk', 'workshop', 'other'], default: 'news', sub: true },
  { key: 'activity_date', label: 'Date', type: 'date', sub: true },
  { key: 'location', label: 'Location', sub: true },
  { key: 'external_url', label: 'URL' },
  { key: 'is_featured', label: 'Featured', type: 'checkbox', sub: true },
  { key: 'content_en', label: 'Content (EN)', type: 'textarea', full: true },
  { key: 'content_ar', label: 'Content (AR)', type: 'textarea', dir: 'rtl', full: true },
]} />

const EducationSection = () => <GenericSection table="education" id="education" fields={[
  { key: 'degree_en', label: 'Degree (EN)', primary: true },
  { key: 'degree_ar', label: 'Degree (AR)', dir: 'rtl' },
  { key: 'field_en', label: 'Field (EN)' },
  { key: 'field_ar', label: 'Field (AR)', dir: 'rtl' },
  { key: 'institution_en', label: 'Institution (EN)', sub: true },
  { key: 'institution_ar', label: 'Institution (AR)', dir: 'rtl' },
  { key: 'country', label: 'Country' },
  { key: 'year_start', label: 'Year Start', type: 'number' },
  { key: 'year_end', label: 'Year End', type: 'number', sub: true },
  { key: 'thesis_title', label: 'Thesis Title' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const PositionsSection = () => <GenericSection table="positions" id="positions" fields={[
  { key: 'title_en', label: 'Title (EN)', primary: true },
  { key: 'title_ar', label: 'Title (AR)', dir: 'rtl' },
  { key: 'institution_en', label: 'Institution (EN)', sub: true },
  { key: 'institution_ar', label: 'Institution (AR)', dir: 'rtl' },
  { key: 'department_en', label: 'Department (EN)' },
  { key: 'department_ar', label: 'Department (AR)', dir: 'rtl' },
  { key: 'year_start', label: 'Year Start', type: 'number', sub: true },
  { key: 'year_end', label: 'Year End', type: 'number' },
  { key: 'is_current', label: 'Current Position', type: 'checkbox', sub: true },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const AwardsSection = () => <GenericSection table="awards" id="awards" fields={[
  { key: 'title_en', label: 'Title (EN)', primary: true },
  { key: 'title_ar', label: 'Title (AR)', dir: 'rtl' },
  { key: 'organization_en', label: 'Organization (EN)', sub: true },
  { key: 'organization_ar', label: 'Organization (AR)', dir: 'rtl' },
  { key: 'year', label: 'Year', type: 'number', sub: true },
  { key: 'description_en', label: 'Description (EN)', type: 'textarea' },
  { key: 'description_ar', label: 'Description (AR)', type: 'textarea', dir: 'rtl' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const MembershipsSection = () => <GenericSection table="memberships" id="memberships" fields={[
  { key: 'organization_en', label: 'Organization (EN)', primary: true },
  { key: 'organization_ar', label: 'Organization (AR)', dir: 'rtl' },
  { key: 'role_en', label: 'Role (EN)', sub: true },
  { key: 'role_ar', label: 'Role (AR)', dir: 'rtl' },
  { key: 'year_start', label: 'Year Start', type: 'number', sub: true },
  { key: 'year_end', label: 'Year End', type: 'number' },
  { key: 'is_current', label: 'Currently Active', type: 'checkbox', default: true },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const CommitteesSection = () => <GenericSection table="committees" id="committees" fields={[
  { key: 'name_en', label: 'Committee Name (EN)', primary: true },
  { key: 'name_ar', label: 'Committee Name (AR)', dir: 'rtl' },
  { key: 'role_en', label: 'Role (EN)', sub: true },
  { key: 'role_ar', label: 'Role (AR)', dir: 'rtl' },
  { key: 'institution_en', label: 'Institution (EN)', sub: true },
  { key: 'institution_ar', label: 'Institution (AR)', dir: 'rtl' },
  { key: 'year_start', label: 'Year Start', type: 'number' },
  { key: 'year_end', label: 'Year End', type: 'number' },
  { key: 'is_current', label: 'Current', type: 'checkbox', sub: true },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const ConferencesSection = () => <GenericSection table="conferences" id="conferences" fields={[
  { key: 'name_en', label: 'Conference Name (EN)', primary: true },
  { key: 'name_ar', label: 'Conference Name (AR)', dir: 'rtl' },
  { key: 'role', label: 'Role', type: 'select', options: ['presenter', 'keynote', 'organizer', 'reviewer', 'attendee'], default: 'presenter', sub: true },
  { key: 'paper_title', label: 'Paper Title' },
  { key: 'location', label: 'Location', sub: true },
  { key: 'country', label: 'Country' },
  { key: 'year', label: 'Year', type: 'number', sub: true },
  { key: 'url', label: 'URL' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

const SupervisionSection = () => <GenericSection table="supervision" id="supervision" fields={[
  { key: 'student_name', label: 'Student Name (EN)', primary: true },
  { key: 'student_name_ar', label: 'اسم الطالب (عربي)', dir: 'rtl' },
  { key: 'degree_level', label: 'Degree Level', type: 'select', options: ['masters', 'phd', 'postdoc'], default: 'phd', sub: true },
  { key: 'thesis_title_en', label: 'Thesis Title (EN)' },
  { key: 'thesis_title_ar', label: 'Thesis Title (AR)', dir: 'rtl' },
  { key: 'institution', label: 'Institution (EN)' },
  { key: 'institution_ar', label: 'المؤسسة (عربي)', dir: 'rtl' },
  { key: 'year_start', label: 'Year Start', type: 'number' },
  { key: 'year_end', label: 'Year End', type: 'number', sub: true },
  { key: 'status', label: 'Status', type: 'select', options: ['ongoing', 'completed', 'withdrawn'], default: 'ongoing', sub: true },
  { key: 'co_supervisor', label: 'Co-Supervisor (EN)' },
  { key: 'co_supervisor_ar', label: 'المشرف المشارك (عربي)', dir: 'rtl' },
  { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
]} />

// ============ SHARED COMPONENTS ============
function SectionHero({ id, title, count, onAdd, onSave, saving, saved, extra }: any) {
  const m = META[id] || {}
  return (
    <AdminHero
      icon={m.icon}
      tone={m.tone}
      glyph={m.glyph}
      title={title}
      ar={m.ar}
      count={count}
      sub={<Link href="/admin/dashboard" className="hover:text-white">← Overview</Link>}
      actions={
        <>
          {extra}
          {onAdd && (
            <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#C9A227] px-4 py-2.5 text-[13.5px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A]">
              <Plus size={15} /> Add new
            </button>
          )}
          {onSave && <SaveBtn onClick={onSave} saving={saving} saved={saved} />}
        </>
      }
    />
  )
}

function SaveBtn({ onClick, saving, saved }: any) {
  return (
    <button onClick={onClick} disabled={saving} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition ${saved ? 'bg-[#0E7C6B] text-white' : 'bg-[#C9A227] text-[#0A1A30] hover:bg-[#E0BC4A]'}`}>
      {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />} {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
    </button>
  )
}

function FormCard({ title, ar, children, onClose }: any) {
  return (
    <section className="page-enter relative overflow-hidden rounded-2xl border border-[#C9A227]/40 bg-surface p-5 shadow-[var(--c-shadow-lg)] sm:p-6">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#C9A227] to-[#12A4D9]" />
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-[15.5px] font-semibold text-ink">{title} {ar && <span className="font-arabic text-[13px] font-normal text-muted">· {ar}</span>}</h3>
        {onClose && <button onClick={onClose} aria-label="Close" className="ms-auto rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-ink"><X size={17} /></button>}
      </div>
      {children}
    </section>
  )
}

function FormButtons({ onSave, onCancel, busy }: any) {
  return (
    <div className="mt-5 flex gap-2.5 border-t border-line pt-4">
      <button onClick={onSave} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-navy px-5 py-2.5 text-[13.5px] font-semibold text-white transition hover:bg-navy-2 disabled:opacity-60">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
      </button>
      <button onClick={onCancel} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-[13.5px] text-ink-2 transition hover:bg-surface-2">
        <X size={14} /> Cancel
      </button>
    </div>
  )
}

function RowActions({ onEdit, onDelete }: any) {
  return (
    <div className="flex shrink-0 gap-1">
      <button onClick={onEdit} aria-label="Edit" className="rounded-lg p-2 text-muted transition hover:bg-sky-soft hover:text-link"><Edit size={15} /></button>
      <button onClick={onDelete} aria-label="Delete" className="rounded-lg p-2 text-muted transition hover:bg-bad-soft hover:text-bad"><Trash2 size={15} /></button>
    </div>
  )
}

function SearchBox({ q, setQ }: any) {
  return (
    <span className="relative ms-auto w-full sm:w-64">
      <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="h-9 w-full rounded-lg border border-line bg-surface ps-8 text-[13px] text-ink outline-none focus:border-[#C9A227]" />
    </span>
  )
}

const inputCls = 'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none transition focus:border-[#C9A227] focus:shadow-[0_0_0_3px_rgba(201,162,39,.12)]'

function Field({ label, value, onChange, type = 'text', dir }: any) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-medium text-ink-2">{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} dir={dir} className={`${inputCls} ${dir === 'rtl' ? 'font-arabic' : ''}`} />
    </label>
  )
}

function Area({ label, value, onChange, rows = 3, dir }: any) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12.5px] font-medium text-ink-2">{label}</span>
      <textarea rows={rows} value={value || ''} onChange={(e) => onChange(e.target.value)} dir={dir || 'ltr'} className={`${inputCls} resize-y ${dir === 'rtl' ? 'font-arabic' : ''}`} />
    </label>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-[#C9A227]" />
    </div>
  )
}

function Empty() {
  return (
    <div className="card p-10 text-center">
      <p className="font-display text-[44px] italic text-[#C9A227]">∅</p>
      <p className="text-[13.5px] text-muted">No items yet. Press “Add new” to start.</p>
    </div>
  )
}
