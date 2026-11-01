'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Upload, Pencil, Eye, Save, Trash2, Copy, CheckCircle2, AlertTriangle, X, FileCode2 } from 'lucide-react'
import { parseMN } from '@/lib/mn/parse'
import { prepareFigures } from '@/lib/py/prepare'
import { Btn } from './ui'

export const AI_PROMPT = `You are converting lecture material into MN Syntax v1.2 (spec attached).
Rules:
1. Start with the YAML header (course, chapter, chapter_title, lecture, title, duration, lang).
2. Begin with ::: outcomes and ::: timeplan blocks.
3. Use ## for sections and ### for sub-sections.
4. Put every definition/theorem/example/remark/recall/caution in its ::: block. Do NOT number them — numbering is automatic. Give important items a {#label} and refer to them with @label.
5. After every example, add a ::: solution block with space=N (N = lines a student needs). Use \`steps\` with >>> for multi-step solutions.
6. Use LaTeX for all math. Number key equations with {#eq:name} after the closing $$ and cite them as (@eq:name).
7. FIGURES — write them in Python inside a \`\`\`pyplot block (matplotlib). Add one whenever a graph helps.
   - Already imported: np, plt, math, mp (mpmath), gamma, ml(z, alpha, beta=1) (Mittag-Leffler),
     caputo(y, t, alpha), fde_solve(f, y0, alpha, t_end, h), axes_through_origin(), pi_ticks().
     scipy and sympy may be imported. Colours: blue, red, green, orange, purple, gold, navy.
   - One figure per block (plt.subplots(1, 2) is fine). Never call plt.show() or savefig, never read files or the internet.
   - Text inside the figure: English or LaTeX ($...$) only. Put the explanation in caption="..." (any language).
   - Label axes and curves, add a legend when there are several curves, keep it under ~5 s of computing.
   - Use the built-in \`\`\`field block (animated phase portrait) only when the motion of trajectories is the point.
8. Use \`\`\`rowops for Gauss–Jordan row reductions.
9. End each lecture with ::: mcq (5 questions, mark the correct option with *, explain with >).
10. Output ONLY the .mn file content, nothing else.`

export default function SheetEditor({ lectureId, which, sheetKey, onSaved, onRemoved }: { lectureId: string; which: 'student' | 'doctor'; sheetKey: string | null; onSaved: (key: string) => void; onRemoved: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<'' | 'load' | 'save' | 'preview'>('')
  const [msg, setMsg] = useState('')
  const [progress, setProgress] = useState('')
  const [errBox, setErrBox] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  // Python figures: start loading Python in the background as soon as the editor opens
  useEffect(() => {
    if (open && /```\s*(pyplot|python|py|matplotlib)\b/.test(text)) import('@/lib/py/client').then((m) => m.warmUpPy())
  }, [open, text])
  const check = useMemo(() => {
    if (!text) return null
    try {
      const d = parseMN(text)
      const counts = { blocks: 0, figures: 0, python: 0, mcq: 0 }
      const walk = (ns: any[]) => ns.forEach((n) => {
        if (n.t === 'block') { counts.blocks++; walk(n.children) }
        if (n.t === 'fig') counts.figures++
        if (n.t === 'py') counts.python++
        if (n.t === 'mcq') counts.mcq += n.questions.length
        if (n.t === 'list') n.items.forEach(walk)
        if (n.t === 'steps') n.steps.forEach(walk)
        if (n.t === 'columns') n.cols.forEach(walk)
      })
      walk(d.nodes)
      return { errors: d.errors, title: d.meta.title, lecture: d.meta.lecture, ...counts }
    } catch (e: any) {
      return { errors: [e.message], title: '', lecture: '', blocks: 0, figures: 0, python: 0, mcq: 0 }
    }
  }, [text])

  const save = async (src: string, draft = false) => {
    setErrBox('')
    setMsg('')
    try {
      await prepareFigures(src, setProgress)
    } finally {
      setProgress('')
    }
    const res = await fetch('/api/admin/sheet', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lectureId, which, text: src, draft }) })
    const j = await res.json()
    if (!res.ok) throw new Error(j.error || 'Save failed')
    return j.key as string
  }

  const load = async () => {
    setOpen(true)
    if (!sheetKey) return setText('')
    setBusy('load')
    const r = await fetch(`/api/admin/sheet?key=${encodeURIComponent(sheetKey)}`)
    setText(await r.text())
    setBusy('')
  }

  const label = which === 'student' ? 'Student sheet' : 'Doctor (solved) sheet'
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <FileCode2 size={18} className={which === 'student' ? 'text-link' : 'text-ok'} />
        <p className="font-semibold text-ink">{label}</p>
        <span className={`rounded-full px-2 py-0.5 text-[11.5px] ${sheetKey ? 'bg-ok-soft text-ok' : 'bg-surface-2 text-muted'}`}>{sheetKey ? 'uploaded' : which === 'doctor' ? 'automatic — same file with solutions shown' : 'none'}</span>
        <div className="ms-auto flex flex-wrap gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept=".mn,.txt,.md,text/plain"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              const src = await f.text()
              const d = parseMN(src)
              if (d.errors.length && !confirm(`The file has ${d.errors.length} issue(s):\n\n${d.errors.slice(0, 6).join('\n')}\n\nUpload anyway?`)) return
              setBusy('save')
              try {
                onSaved(await save(src))
                setMsg('Uploaded ✓')
              } catch (err: any) {
                setErrBox(err.message)
              }
              setBusy('')
            }}
          />
          <Btn small kind="gold" busy={busy === 'save' && !open} onClick={() => fileRef.current?.click()}><Upload size={13} /> Upload .mn</Btn>
          <Btn small kind="ghost" busy={busy === 'load'} onClick={load}><Pencil size={13} /> {sheetKey ? 'Edit' : 'Write'}</Btn>
          {sheetKey && (
            <Btn small kind="danger" onClick={() => confirm('Remove this sheet from the lecture?') && onRemoved()}><Trash2 size={13} /></Btn>
          )}
        </div>
      </div>
      {msg && !progress && <p className="mt-2 text-[12.5px] text-ok">{msg}</p>}
      {errBox && (
        <div className="mt-2 rounded-lg border border-bad/30 bg-bad-soft p-3 text-[12.5px] text-bad">
          <div className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle size={14} /> Not saved <button onClick={() => setErrBox('')} className="ms-auto text-bad/70"><X size={13} /></button></div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[12px]" dir="ltr">{errBox}</pre>
        </div>
      )}
      {progress && (
        <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-sky-soft px-3 py-1.5 text-[12.5px] text-link">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#BFE3F2] border-t-[#0B6FA4]" /> {progress}
        </p>
      )}

      {open && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
            {check && (check.errors.length ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-bad-soft px-2.5 py-1 text-bad"><AlertTriangle size={13} /> {check.errors.length} issue(s)</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-1 text-ok"><CheckCircle2 size={13} /> valid · {check.blocks} boxes · {check.figures + check.python} figures{check.python ? ` (${check.python} Python)` : ''} · {check.mcq} MCQs</span>
            ))}
            <button onClick={() => navigator.clipboard.writeText(AI_PROMPT).then(() => setMsg('AI prompt copied — paste it with the MN spec into your AI tool.'))} className="inline-flex items-center gap-1 text-link hover:underline"><Copy size={12} /> Copy AI prompt</button>
            <button onClick={() => setOpen(false)} className="ms-auto inline-flex items-center gap-1 text-muted"><X size={13} /> Close</button>
          </div>
          {check && check.errors.length > 0 && (
            <ul className="max-h-28 overflow-y-auto rounded-lg bg-bad-soft p-2.5 font-mono text-[12px] text-bad">
              {check.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            dir="ltr"
            className="h-[52vh] w-full resize-y rounded-lg border border-line bg-[#0B1A2E] p-3 font-mono text-[13px] leading-relaxed text-[#E6EDF5] outline-none focus:border-[#C9A227]"
            placeholder={'---\ncourse: ...\nlecture: 1\ntitle: ...\n---\n\n## Section\n\n::: definition "Title"\n...\n:::'}
          />
          <div className="flex flex-wrap gap-2">
            <Btn
              kind="dark"
              busy={busy === 'save'}
              onClick={async () => {
                setBusy('save')
                try {
                  onSaved(await save(text))
                  setMsg('Saved ✓ — students see the new version now.')
                } catch (err: any) {
                  setErrBox(err.message)
                }
                setBusy('')
              }}
            >
              <Save size={14} /> Save & publish sheet
            </Btn>
            <Btn
              kind="ghost"
              busy={busy === 'preview'}
              onClick={async () => {
                setBusy('preview')
                try {
                  const k = await save(text, true)
                  window.open(`/admin/mn-guide?key=${encodeURIComponent(k)}&mode=${which}`, '_blank')
                } catch (err: any) {
                  setErrBox(err.message)
                }
                setBusy('')
              }}
            >
              <Eye size={14} /> Preview
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}
