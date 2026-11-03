import type { Metadata } from 'next'
import Link from 'next/link'
import { GraduationCap, KeyRound, FileText, PlayCircle } from 'lucide-react'
import PageHero from '@/components/ui/PageHero'
import CourseCard from '@/components/student/CourseCard'
import { getPublicCourses } from '@/lib/data'
import { isLang } from '@/lib/i18n'

export const metadata: Metadata = { title: 'Courses' }

const T = {
  en: {
    eyebrow: 'Teaching', title: 'Courses', lede: 'Lecture sheets, solved versions, videos and course files — open to every student.',
    how: 'How it works', steps: ['Open any course below — no account needed to read the lectures', 'Create a free account with your university email to download PDFs and files', 'In a hall without internet? Press “Save for offline” on the course page first'],
    reg: 'Create account', login: 'Student login', empty: 'Courses will appear here soon.',
    feats: [['Student & solved sheets', 'Interactive, animated, on any phone'], ['Lecture videos', 'Watch inside each lecture'], ['Course files', 'PDFs stamped with your ID']],
  },
  ar: {
    eyebrow: 'التدريس', title: 'المساقات', lede: 'أوراق المحاضرات، النسخ المحلولة، الفيديوهات وملفات المساق — متاحة لكل الطلاب.',
    how: 'كيف يعمل', steps: ['افتح أي مساق من الأسفل — قراءة المحاضرات لا تحتاج حساباً', 'أنشئ حساباً مجانياً ببريدك الجامعي لتحميل ملفات PDF والملفات', 'في قاعة بلا إنترنت؟ اضغط «حفظ للعرض بلا إنترنت» في صفحة المساق مسبقاً'],
    reg: 'إنشاء حساب', login: 'دخول الطلاب', empty: 'ستظهر المساقات هنا قريباً.',
    feats: [['ورقة الطالب والورقة المحلولة', 'تفاعلية ومتحركة وتعمل على الهاتف'], ['فيديوهات المحاضرات', 'تُشاهد داخل كل محاضرة'], ['ملفات المساق', 'ملفات PDF تحمل رقمك الجامعي']],
  },
}

export default async function CoursesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params
  const lang = isLang(l) ? l : 'en'
  const t = T[lang]
  const courses = await getPublicCourses()
  const icons = [FileText, PlayCircle, KeyRound]
  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} lede={t.lede} variant="spiral" equations={['∫ₐᵇ f(x) dx', 'X′ = AX + F(t)', 'Γ(n+1) = n!']}>
        <div className="page-enter flex flex-wrap gap-3 [animation-delay:300ms]">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-md bg-[#C9A227] px-5 py-3 text-[14.5px] font-semibold text-[#0A1A30] transition hover:bg-[#E0BC4A]">
            <GraduationCap size={17} /> {t.reg}
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-[14.5px] text-white transition hover:border-[#C9A227]">
            {t.login}
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-[1680px] px-4 sm:px-7 lg:px-12 2xl:px-[72px] py-10 sm:py-14">
        {courses.length === 0 ? (
          <p className="card py-10 text-center text-muted">{t.empty}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c: any, i: number) => <CourseCard key={c.id} c={c} lang={lang} i={i} />)}
          </div>
        )}
      </section>

      <section className="pb-14 sm:pb-20">
        <div className="mx-auto grid max-w-[1680px] gap-5 px-4 sm:px-7 lg:px-12 2xl:px-[72px] lg:grid-cols-2">
          <div className="card reveal p-6 sm:p-8">
            <p className="mb-5 text-[12px] font-semibold uppercase tracking-[.12em] text-gold-ink rtl:tracking-normal">{t.how}</p>
            <ol className="space-y-4">
              {t.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy font-display text-[18px] italic text-[#E3C566]">{i + 1}</span>
                  <span className="pt-2 text-[15.5px] text-ink-2">{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-3">
            {t.feats.map(([h, d], i) => {
              const Icon = icons[i]
              return (
                <div key={h} className="card reveal flex items-center gap-4 p-5" style={{ ['--d' as any]: `${i * 100}ms` }}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#C9A227]/12 text-gold-ink"><Icon size={20} /></span>
                  <span>
                    <span className="block font-semibold text-ink">{h}</span>
                    <span className="block text-[13.5px] text-muted">{d}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
