import { notFound } from 'next/navigation'
import Sheet from '@/components/mn/Sheet'
import PrintReady from '@/components/mn/PrintReady'
import { parseMN } from '@/lib/mn/parse'
import { attachPy } from '@/lib/mn/pyfigs'
import { readSheet } from '@/lib/courses'
import { SAMPLES } from '@/lib/mn/samples'
import { verifyPrint } from '@/lib/pdf/token'

export const dynamic = 'force-dynamic'
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const v = verifyPrint((await searchParams).t)
  let title = 'Lecture sheet'
  if (v) {
    const src = v.key.startsWith('sample:') ? SAMPLES[v.key.slice(7)]?.src : await readSheet(v.key).catch(() => null)
    const m = src ? parseMN(src).meta : null
    if (m?.title) title = `${m.lecture ? `Lecture ${m.lecture} — ` : ''}${m.title}`
  }
  return { title: { absolute: title }, robots: { index: false } }
}

/** A4 print layout of one sheet — opened only by the PDF renderer (signed, 2-minute token). */
export default async function PrintSheet({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams
  const v = verifyPrint(t)
  if (!v) notFound()
  let src: string | null = null
  if (v.key.startsWith('sample:')) src = SAMPLES[v.key.slice(7)]?.src ?? null
  else src = await readSheet(v.key).catch(() => null)
  if (!src) notFound()
  const doc = await attachPy(parseMN(src))
  return (
    <div className="mn-printing">
      <Sheet doc={doc} mode={v.mode} courseName={v.course} bare />
      <PrintReady />
    </div>
  )
}
