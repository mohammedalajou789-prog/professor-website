import { FileText, Link2, Download, Lock } from 'lucide-react'
import type { CourseFile } from '@/lib/courses'

const fmtSize = (n: number | null) => (!n ? '' : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`)

/** One course file. Links are open to everyone; downloading a file needs a site account. */
export default function FileRow({ f, ar, canDownload = true, back }: { f: CourseFile; ar: boolean; canDownload?: boolean; back?: string }) {
  const isLink = f.kind === 'link'
  const locked = !isLink && !canDownload
  const href = isLink ? f.url! : locked ? `/login?next=${encodeURIComponent(back || '/courses')}` : `/api/course-file/${f.id}`
  return (
    <li>
      <a href={href} target={isLink ? '_blank' : undefined} rel="noopener noreferrer" className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-surface-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isLink ? 'bg-sky-soft text-link' : 'bg-bad-soft text-bad'}`}>{isLink ? <Link2 size={17} /> : <FileText size={17} />}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-ink">{ar ? f.title_ar || f.title_en : f.title_en}</span>
          <span className="block text-[11.5px] text-muted">
            {isLink ? (ar ? 'رابط' : 'Link') : locked ? (ar ? 'سجّل الدخول للتحميل' : 'Sign in to download') : fmtSize(f.size_bytes) || 'PDF'}
          </span>
        </span>
        {locked ? <Lock size={15} className="text-muted" /> : <Download size={15} className="text-muted transition group-hover:text-[#C9A227]" />}
      </a>
    </li>
  )
}
