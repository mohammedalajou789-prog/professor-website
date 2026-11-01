import Link from 'next/link'
import Sheet, { sheetToc } from '@/components/mn/Sheet'
import SheetTools from '@/components/mn/SheetTools'
import FocusReading from '@/components/mn/FocusReading'
import { parseMN } from '@/lib/mn/parse'
import { SAMPLES } from '@/lib/mn/samples'
import { requireAdmin } from '@/lib/auth'
import { getText, r2Configured } from '@/lib/r2'
import { attachPy } from '@/lib/mn/pyfigs'

export const dynamic = 'force-dynamic'

/** Admin reference: sample sheets in both versions, plus draft previews from the sheet editor. */
export default async function MnGuide({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ s?: string; mode?: string; key?: string; l?: string }> }) {
  const demo = process.env.MN_DEMO_PUBLIC === '1'
  if (!demo) await requireAdmin()
  const [sp, { lang: siteLang }] = await Promise.all([searchParams, params])
  const draft = sp.key && sp.key.startsWith('courses/') ? await getText(sp.key).catch(() => null) : null
  const sample = sp.s && SAMPLES[sp.s] ? sp.s : 'complete'
  const src = draft ?? SAMPLES[sample].src
  const mode = sp.mode === 'student' ? 'student' : 'doctor'
  // bilingual sheets follow the site language; the EN / ع switch below previews the other one
  const viewLang = sp.l === 'ar' || sp.l === 'en' ? sp.l : siteLang === 'ar' ? 'ar' : 'en'
  const doc = await attachPy(parseMN(src, { lang: viewLang }))
  const base0 = draft ? `/admin/mn-guide?key=${encodeURIComponent(sp.key!)}` : `/admin/mn-guide?s=${sample}`
  const base = doc.bilingual && sp.l ? `${base0}&l=${viewLang}` : base0
  const toc = sheetToc(doc)
  const pad = 'px-3 sm:px-5 lg:px-7'
  const seg = (href: string, on: boolean, label: string, ar: string) => (
    <Link
      href={href}
      replace
      scroll={false}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition ${on ? 'bg-[#0B6FA4] text-white shadow-sm' : 'text-ink-2 hover:text-ink'}`}
    >
      {label} <bdi className="hidden font-arabic text-[12px] font-normal opacity-80 sm:inline">({ar})</bdi>
    </Link>
  )
  return (
    <div className="min-h-screen">
      <FocusReading />
      <header className="admin-hero mx-3 mt-3 overflow-hidden rounded-2xl px-5 pb-5 pt-6 text-white sm:mx-5 sm:mt-5 sm:px-7 lg:mx-7 lg:mt-7">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[.14em] text-[#E3C566]">Sheet guide · دليل الشيتات</p>
          <h1 className="mt-1 font-display text-[clamp(22px,2.6vw,30px)] font-semibold">
            {draft ? 'Draft preview · معاينة قبل النشر' : 'Example sheets · أمثلة جاهزة'}
          </h1>
          <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-[#C4CFDE]">
            {draft
              ? 'This is how the sheet will look. Nothing is published until you press Save.'
              : 'Examples only — not part of any course. Pick one to see what a sheet can contain, then switch between the doctor and student versions.'}
            <span dir="rtl" className="mt-0.5 block text-end font-arabic text-[#AEBBCC]">
              {draft ? 'هكذا سيظهر الشيت. لا يُنشر شيء حتى تضغط Save.' : 'أمثلة فقط وليست جزءاً من أي مساق: اختر مثالاً، ثم بدّل بين نسخة الدكتور ونسخة الطالب.'}
            </span>
          </p>
          {!draft && (
            <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {Object.entries(SAMPLES).map(([k, v]) => (
                <Link
                  key={k}
                  href={`/admin/mn-guide?s=${k}&mode=${mode}`}
                  replace
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${k === sample ? 'bg-[#C9A227] text-[#0A1A30]' : 'bg-white/[.08] text-[#DCE4EE] ring-1 ring-white/15 hover:bg-white/[.14]'}`}
                >
                  {v.label}
                </Link>
              ))}
            </div>
          )}
          {!draft && (() => {
            const [en, ar] = SAMPLES[sample].desc.split(' · ')
            return (
              <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-[#AEBBCC]">
                {en}
                {ar && <span dir="rtl" className="block text-end font-arabic">{ar}</span>}
              </p>
            )
          })()}
        </div>
      </header>

      <div className={`under-nav sticky z-30 mt-5 border-y border-line bg-surface ${pad} lg:-mx-5 lg:px-12`}>
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center gap-2 py-2">
          <div className="flex shrink-0 rounded-lg bg-surface-2 p-0.5 ring-1 ring-line">
            {seg(`${base}&mode=doctor`, mode === 'doctor', 'Doctor', 'المحلولة')}
            {seg(`${base}&mode=student`, mode === 'student', 'Student', 'الطالب')}
          </div>
          {doc.bilingual && (
            <div className="flex shrink-0 rounded-lg bg-surface-2 p-0.5 ring-1 ring-line" title="Bilingual sheet — students see the language of the site · شيت بلغتين">
              {seg(`${base0}&mode=${mode}&l=en`, viewLang === 'en', 'EN', 'English')}
              {seg(`${base0}&mode=${mode}&l=ar`, viewLang === 'ar', 'ع', 'عربي')}
            </div>
          )}
          <p className="hidden min-w-0 truncate text-[13px] text-muted md:block">{draft ? 'Draft preview' : SAMPLES[sample].label}</p>
          <div className="ms-auto flex shrink-0 items-center gap-2">
            <SheetTools toc={toc} />
          </div>
        </div>
      </div>

      {doc.errors.length > 0 && (
        <div className={`${pad} pt-5`}>
          <div className="mx-auto max-w-[980px] rounded-xl border border-bad/30 bg-bad-soft p-4 text-[13px] text-bad">
            <p className="mb-1 font-semibold">{doc.errors.length} issue(s) found by the MN checker · أخطاء في الملف:</p>
            <ul className="list-disc ps-5 font-mono text-[12px]">{doc.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        </div>
      )}
      <div className="paper py-5 sm:px-6 sm:py-8">
        <Sheet doc={doc} mode={mode} watermark={mode === 'student' ? '20231234' : null} pyLive={!demo && r2Configured() ? 'upload' : 'view'} />
      </div>
    </div>
  )
}
