import { FileText, Link2, Download } from 'lucide-react'
import type { CourseFile } from '@/lib/courses'

const fmtSize = (n: number | null) => (!n ? '' : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`)

export default function FileRow({ f, ar }: { f: CourseFile; ar: boolean }) {
  const isLink = f.kind === 'link'
  return (
    <li>
      <a href={isLink ? f.url! : `/api/course-file/${f.id}`} target={isLink ? '_blank' : undefined} rel="noopener noreferrer" className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-2">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isLink ? 'bg-surface-2 text-link' : 'bg-bad-soft text-bad'}`}>{isLink ? <Link2 size={16} /> : <FileText size={16} />}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-ink">{ar ? f.title_ar || f.title_en : f.title_en}</span>
          <span className="block text-[11.5px] text-muted">{isLink ? (ar ? 'رابط' : 'Link') : fmtSize(f.size_bytes) || 'PDF'}</span>
        </span>
        <Download size={15} className="text-muted transition group-hover:text-[#C9A227]" />
      </a>
    </li>
  )
}
