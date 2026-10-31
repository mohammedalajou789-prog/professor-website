'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Link2, Trash2, FileText, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadToR2 } from '@/lib/admin-client'
import { Btn, inp } from './ui'

export default function FilesManager({ courseId, lectureId, files }: { courseId: string; lectureId: string | null; files: any[] }) {
  const router = useRouter()
  const ref = useRef<HTMLInputElement>(null)
  const [prog, setProg] = useState<number | null>(null)
  const [link, setLink] = useState({ title: '', url: '' })
  const [showLink, setShowLink] = useState(false)
  const mine = files.filter((f) => (f.lecture_id || null) === lectureId)

  const upload = async (list: FileList) => {
    const sb = createClient()
    for (const f of Array.from(list)) {
      try {
        setProg(0)
        const key = await uploadToR2(f, `courses/${courseId}`, setProg)
        const title = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        const { error } = await sb.from('course_files').insert({ course_id: courseId, lecture_id: lectureId, title_en: title, kind: 'file', r2_key: key, mime: f.type, size_bytes: f.size, sort_order: mine.length })
        if (error) throw error
      } catch (e: any) {
        alert(e.message)
      }
    }
    setProg(null)
    router.refresh()
  }

  return (
    <div>
      <ul className="mb-3 divide-y divide-line">
        {mine.length === 0 && <li className="py-3 text-[13px] text-[#A9B6C9]">No files yet.</li>}
        {mine.map((f) => (
          <li key={f.id} className="flex items-center gap-2.5 py-2">
            {f.kind === 'link' ? <Link2 size={16} className="text-link" /> : <FileText size={16} className="text-bad" />}
            <input
              defaultValue={f.title_en}
              className="min-w-0 flex-1 rounded border border-transparent px-1.5 py-1 text-[14px] text-ink hover:border-line focus:border-[#C9A227] focus:outline-none"
              onBlur={async (e) => e.target.value !== f.title_en && (await createClient().from('course_files').update({ title_en: e.target.value }).eq('id', f.id))}
            />
            <a href={f.kind === 'link' ? f.url : `/api/course-file/${f.id}?view=1`} target="_blank" className="p-1.5 text-muted hover:text-ink"><ExternalLink size={14} /></a>
            <button
              onClick={async () => {
                if (!confirm(`Delete "${f.title_en}"?`)) return
                await createClient().from('course_files').delete().eq('id', f.id)
                if (f.r2_key) fetch(`/api/admin/object?key=${encodeURIComponent(f.r2_key)}`, { method: 'DELETE' })
                router.refresh()
              }}
              className="p-1.5 text-bad/70 hover:text-bad"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      {prog !== null && (
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-gradient-to-r from-[#0B6FA4] to-[#12A4D9] transition-all" style={{ width: `${Math.round(prog * 100)}%` }} />
        </div>
      )}
      <input ref={ref} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.png,.jpg,.jpeg" onChange={(e) => e.target.files && upload(e.target.files)} />
      <div className="flex flex-wrap gap-2">
        <Btn small kind="gold" busy={prog !== null} onClick={() => ref.current?.click()}><Upload size={13} /> Upload files</Btn>
        <Btn small kind="ghost" onClick={() => setShowLink(!showLink)}><Link2 size={13} /> Add link</Btn>
      </div>
      {showLink && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
          <input className={inp} placeholder="Title" value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} />
          <input className={inp} placeholder="https://…" dir="ltr" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} />
          <Btn
            kind="dark"
            onClick={async () => {
              if (!link.title || !/^https?:\/\//.test(link.url)) return alert('Title and a full https:// link are required')
              await createClient().from('course_files').insert({ course_id: courseId, lecture_id: lectureId, title_en: link.title, kind: 'link', url: link.url, watermark: false })
              setLink({ title: '', url: '' })
              setShowLink(false)
              router.refresh()
            }}
          >
            Add
          </Btn>
        </div>
      )}
      <p className="mt-2 text-[11.5px] text-muted">PDFs downloaded by students are automatically stamped with their university ID.</p>
    </div>
  )
}
