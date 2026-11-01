import Link from 'next/link'
import Sheet, { sheetToc } from '@/components/mn/Sheet'
import SheetTools from '@/components/mn/SheetTools'
import { parseMN } from '@/lib/mn/parse'
import { SAMPLES } from '@/lib/mn/samples'
import { requireAdmin } from '@/lib/auth'
import { getText, r2Configured } from '@/lib/r2'
import { attachPy } from '@/lib/mn/pyfigs'

export const dynamic = 'force-dynamic'

/** Admin reference: sample sheets in both versions, plus draft previews from the sheet editor. */
export default async function MnGuide({ searchParams }: { searchParams: Promise<{ s?: string; mode?: string; key?: string }> }) {
  const demo = process.env.MN_DEMO_PUBLIC === '1'
  if (!demo) await requireAdmin()
  const sp = await searchParams
  const draft = sp.key && sp.key.startsWith('courses/') ? await getText(sp.key).catch(() => null) : null
  const sample = sp.s && SAMPLES[sp.s] ? sp.s : 'lecture1'
  const src = draft ?? SAMPLES[sample].src
  const mode = sp.mode === 'student' ? 'student' : 'doctor'
  const doc = await attachPy(parseMN(src))
  const base = draft ? `/admin/mn-guide?key=${encodeURIComponent(sp.key!)}` : `/admin/mn-guide?s=${sample}`
  const chip = (href: string, on: boolean, label: string) => (
    <Link key={href} href={href} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${on ? 'bg-[#0B6FA4] text-white' : 'bg-surface text-ink-2 ring-1 ring-line hover:ring-[#0B6FA4]/40'}`}>
      {label}
    </Link>
  )
  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-7">
      <header className="admin-hero mb-5 overflow-hidden rounded-2xl px-5 py-6 text-white sm:px-7">
        <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-[#E3C566]">MN sheets · دليل الشيتات</p>
        <h1 className="mt-1 font-display text-[clamp(22px,2.6vw,30px)] font-semibold">{draft ? 'Draft preview · معاينة قبل النشر' : 'Example sheets · أمثلة جاهزة'}</h1>
        <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-[#AEBBCC]">
          {draft
            ? 'This is how the sheet will look. Nothing is published until you press Save.'
            : 'These are examples only — they are not part of any course. They show what a sheet can contain, in both versions (doctor / student). Claude uses the same files as a model.'}
          <span className="mt-0.5 block font-arabic">{draft ? 'هكذا سيظهر الشيت. لا يُنشر شيء حتى تضغط Save.' : 'هذه أمثلة فقط وليست جزءاً من أي مساق: تُظهر ما يمكن أن يحتويه الشيت بنسختيه.'}</span>
        </p>
      </header>
      <div className="mx-auto mb-3 flex max-w-[980px] flex-wrap items-center gap-2">
        {draft ? <span className="text-[13px] font-semibold text-gold-ink">Draft preview</span> : Object.entries(SAMPLES).map(([k, v]) => chip(`/admin/mn-guide?s=${k}&mode=${mode}`, k === sample, v.label))}
      </div>
      {!draft && <p className="mx-auto mb-3 max-w-[980px] text-[13px] leading-relaxed text-ink-2">{SAMPLES[sample].desc}</p>}
      <div className="sticky top-16 z-30 -mx-3 mb-5 border-b border-line bg-bg px-3 py-2 sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7">
        <div className="mx-auto flex max-w-[980px] flex-wrap items-center gap-2">
          {chip(`${base}&mode=doctor`, mode === 'doctor', 'Doctor version · المحلولة')}
          {chip(`${base}&mode=student`, mode === 'student', 'Student version · الطالب')}
          <div className="ms-auto flex items-center gap-2"><SheetTools toc={sheetToc(doc)} /></div>
        </div>
      </div>
      {doc.errors.length > 0 && (
        <div className="mx-auto mb-4 max-w-[980px] rounded-xl border border-bad/30 bg-bad-soft p-4 text-[13px] text-bad">
          <p className="mb-1 font-semibold">{doc.errors.length} issue(s) found by the MN checker:</p>
          <ul className="list-disc ps-5 font-mono text-[12px]">{doc.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      <Sheet doc={doc} mode={mode} watermark={mode === 'student' ? '20231234' : null} pyLive={!demo && r2Configured() ? 'upload' : 'view'} />
    </div>
  )
}
