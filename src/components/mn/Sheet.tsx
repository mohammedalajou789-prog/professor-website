import 'katex/dist/katex.min.css'
import './sheet.css'
import type { Doc, Node } from '@/lib/mn/parse'
import { inline, tex, esc } from '@/lib/mn/render-inline'
import { renderRowOps } from '@/lib/mn/rowops'
import MCQBlock from './MCQBlock'
import StepsBlock from './StepsBlock'
import Figure from './Figure'
import PyFigure from './PyFigure'
import SheetChrome from './SheetChrome'

export type SheetMode = 'student' | 'doctor'
type Ctx = { doc: Doc; mode: SheetMode; ar: boolean; pyLive?: PyLiveMode }
export type PyLiveMode = 'upload' | 'view' | false

const AR_LABEL: Record<string, string> = {
  definition: 'تعريف', theorem: 'مبرهنة', lemma: 'تمهيدية', corollary: 'نتيجة', proposition: 'قضية',
  example: 'مثال', solution: 'الحل', proof: 'البرهان', remark: 'ملاحظة', remarks: 'ملاحظات', howto: 'طريقة الحل',
  recall: 'تذكير', caution: 'تنبيه', keybox: '', note: 'ملاحظة', homework: 'واجب', outcomes: 'نواتج التعلّم',
  illustration: 'توضيح', teacher: 'ملاحظة للمدرّس', summary: 'ملخّص', answer: 'الإجابة',
}
export const SHEET_T = {
  en: { solved: 'Solved Version', student: 'Student Version', lecture: 'Lecture', chapter: 'Chapter', minutes: 'minutes', outcomes: 'Learning outcomes', plan: 'Suggested time plan', recallFrom: 'Recall from', licensed: 'Licensed to', space: 'Space for your solution', answer: 'Answer.', hw: 'Homework',
    footer: (a: string) => `Prepared by ${a}, Dept. of Mathematics, Al-Balqa Applied University. Printing requires prior permission from the author.` },
  ar: { solved: 'النسخة المحلولة', student: 'نسخة الطالب', lecture: 'المحاضرة', chapter: 'الفصل', minutes: 'دقيقة', outcomes: 'نواتج التعلّم', plan: 'الخطة الزمنية المقترحة', recallFrom: 'تذكير من', licensed: 'مرخّص لـ', space: 'مساحة لكتابة الحل', answer: 'الإجابة.', hw: 'واجب',
    footer: (a: string) => `إعداد ${a}، قسم الرياضيات، جامعة البلقاء التطبيقية. الطباعة تتطلب إذناً مسبقاً من المؤلف.` },
}

const H = (html: string) => ({ dangerouslySetInnerHTML: { __html: html } })

const BLOCK_LABEL: Record<string, string> = {
  definition: 'Definition', theorem: 'Theorem', lemma: 'Lemma', corollary: 'Corollary', proposition: 'Proposition',
  example: 'Example', solution: 'Solution', proof: 'Proof', remark: 'Remark', remarks: 'Remarks', howto: 'How to',
  recall: 'Recall', caution: 'Caution', keybox: '', note: 'Note', homework: 'Homework', outcomes: 'Learning outcomes',
  illustration: 'Illustration', teacher: 'Teaching note', summary: 'Summary', answer: 'Answer',
}

function Nodes({ nodes, ctx }: { nodes: Node[]; ctx: Ctx }) {
  const out: React.ReactNode[] = []
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]
    // learning outcomes + time plan → one two-column box (as in the PDF)
    if (n.t === 'block' && n.kind === 'outcomes' && nodes[i + 1]?.t === 'timeplan') {
      out.push(<Outcomes key={i} outcomes={n} plan={nodes[i + 1] as any} ctx={ctx} />)
      i++
      continue
    }
    out.push(<NodeView key={i} n={n} ctx={ctx} />)
  }
  return <>{out}</>
}

function NodeView({ n, ctx }: { n: Node; ctx: Ctx }) {
  const { doc } = ctx
  switch (n.t) {
    case 'h2':
      return (
        <h2 id={n.id} className="mn-h2 reveal" data-toc={n.id}>
          <span {...H(inline(n.text, doc.labels))} />
        </h2>
      )
    case 'h3':
      return <h3 className="mn-h3 reveal" {...H(inline(n.text, doc.labels))} />
    case 'p':
      return <p className="mn-p" {...H(inline(n.text, doc.labels))} />
    case 'math':
      return (
        <div className="mn-math reveal" id={n.label}>
          <div className="mn-math-body mn-write" {...H(tex(n.tex, true))} />
          {(n.num || n.tag) && <span className="mn-eqnum">{n.num || `(${n.tag})`}</span>}
        </div>
      )
    case 'list': {
      const Tag = n.style === 'num' || n.style === 'paren' || n.style === 'roman' ? 'ol' : 'ul'
      return (
        <Tag className={`mn-list mn-list-${n.style}`}>
          {n.items.map((it, k) => (
            <li key={k} data-n={n.style === 'paren' ? `(${k + 1})` : n.style === 'roman' ? `${toRoman(k + 1)}.` : n.style === 'num' ? `${k + 1}.` : undefined}>
              <Nodes nodes={it} ctx={ctx} />
            </li>
          ))}
        </Tag>
      )
    }
    case 'table':
      return (
        <div className="mn-table-wrap reveal">
          <table className="mn-table">
            <thead>
              <tr>{n.head.map((h, k) => <th key={k} style={{ textAlign: al(n.align[k]) }} {...H(inline(h, doc.labels))} />)}</tr>
            </thead>
            <tbody>
              {n.rows.map((r, j) => (
                <tr key={j}>{r.map((c, k) => <td key={k} style={{ textAlign: al(n.align[k]) }} {...H(inline(c, doc.labels))} />)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'block':
      return <Block n={n} ctx={ctx} />
    case 'steps':
      return <StepsBlock ar={ctx.ar} steps={n.steps.map((s, k) => <Nodes key={k} nodes={s} ctx={ctx} />)} />
    case 'mcq':
      return (
        <MCQBlock
          ar={ctx.ar}
          mode={ctx.mode}
          lecture={doc.meta.lecture || ''}
          questions={n.questions.map((q) => ({
            q: inline(q.q, doc.labels),
            options: q.options.map((o) => ({ html: inline(o.text, doc.labels), correct: o.correct })),
            explain: q.explain ? inline(q.explain, doc.labels) : '',
          }))}
        />
      )
    case 'rowops': {
      const parts = renderRowOps(n.body)
      return (
        <div className="mn-rowops reveal">
          {parts.map((p, k) => (
            <span key={k} className="mn-rowop" style={{ ['--d' as any]: `${k * 450}ms` }} {...H(p.html)} />
          ))}
        </div>
      )
    }
    case 'fig':
      return (
        <figure className="mn-fig reveal">
          <Figure kind={n.kind} attrs={n.attrs} body={n.body} />
          {n.attrs.caption && <figcaption {...H(inline(n.attrs.caption, doc.labels))} />}
        </figure>
      )
    case 'py': {
      const w = n.attrs.width
      return (
        <figure className="mn-fig mn-py reveal" style={w ? ({ ['--py-w' as any]: /^\d+$/.test(w) ? `${w}px` : w }) : undefined}>
          {n.svg ? (
            <div className="mn-py-svg" role="img" aria-label={n.attrs.caption || 'Figure'} {...H(n.svg)} />
          ) : ctx.pyLive ? (
            <PyFigure code={n.code} hash={n.hash} upload={ctx.pyLive === 'upload'} />
          ) : (
            <div className="mn-py-missing">{ctx.ar ? 'الرسم قيد التجهيز' : 'Figure is being prepared'}</div>
          )}
          {n.attrs.caption && <figcaption {...H(inline(n.attrs.caption, doc.labels))} />}
        </figure>
      )
    }
    case 'columns':
      return (
        <div className="mn-columns" style={{ ['--cols' as any]: n.cols.length }}>
          {n.cols.map((c, k) => (
            <div key={k}>
              <Nodes nodes={c} ctx={ctx} />
            </div>
          ))}
        </div>
      )
    case 'timeplan':
      return <TimePlan rows={n.rows} ctx={ctx} />
    case 'image':
      return (
        <figure className="mn-fig reveal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={n.src.startsWith('http') ? n.src : ''} alt={n.caption} style={{ maxWidth: n.width || '100%' }} loading="lazy" />
          {n.caption && <figcaption {...H(inline(n.caption, doc.labels))} />}
        </figure>
      )
    case 'video':
      return (
        <div className="mn-video reveal">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(n.id)}?rel=0&modestbranding=1${n.start ? `&start=${n.start}` : ''}`}
            title="Video"
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      )
    case 'desmos':
      return (
        <div className="mn-video reveal">
          <iframe src={`${n.url}?embed`} title="Desmos" loading="lazy" />
        </div>
      )
    case 'pagebreak':
      return <div className="mn-pagebreak" />
    case 'hr':
      return <hr className="mn-hr" />
  }
}

function Block({ n, ctx }: { n: Extract<Node, { t: 'block' }>; ctx: Ctx }) {
  const { doc, mode, ar } = ctx
  const T = ar ? SHEET_T.ar : SHEET_T.en
  const k = n.kind
  const student = mode === 'student'

  if (k === 'teacher' && student) return null
  if (k === 'answer') {
    if (student) return null
    return (
      <div className="mn-answer">
        <strong>{T.answer}</strong> <Nodes nodes={n.children} ctx={ctx} />
      </div>
    )
  }

  const hideBody = student && (k === 'solution' || (k === 'proof' && n.attrs.hide))
  const lines = Number(n.attrs.space) || 8
  let label = (ar ? AR_LABEL[k] : BLOCK_LABEL[k]) ?? k[0].toUpperCase() + k.slice(1)
  if (k === 'recall') label = n.attrs.from ? `${T.recallFrom} ${n.attrs.from}${n.title ? ':' : ''}` : `${ar ? 'تذكير' : 'Recall'}${n.title ? ':' : ''}`
  const titleHtml = n.title ? inline(n.title, doc.labels) : ''

  const head =
    k === 'recall' ? (
      <>
        {label} <span {...H(titleHtml)} />
      </>
    ) : k === 'howto' || k === 'summary' || k === 'note' ? (
      <span {...H(titleHtml || esc(label))} />
    ) : k === 'keybox' ? null : (
      <>
        {label}
        {n.num && <> {n.num}</>}
        {n.title && (
          <span className="mn-box-sub">
            {' '}
            (<span {...H(titleHtml)} />)
          </span>
        )}
        {n.attrs.homework && <span className="mn-hw">{T.hw}</span>}
      </>
    )

  // tab-style (Solution / Proof) and side-bar style (Remark / How to) vs. title-bar boxes
  const style = k === 'solution' || k === 'proof' ? 'tab' : ['remark', 'remarks', 'howto', 'illustration', 'teacher'].includes(k) ? 'side' : k === 'keybox' || k === 'note' ? 'plain' : 'bar'

  const inlineRemark = style === 'side' && n.children[0]?.t === 'p'

  return (
    <section id={n.label} className={`mn-box mn-${k} mn-style-${style} reveal ${hideBody ? 'mn-blank' : ''}`} data-anim={n.attrs.animate}>
      {style === 'bar' && head && <header className="mn-box-title">{head}</header>}
      {style === 'tab' && <span className="mn-tab">{label}</span>}
      {style === 'plain' && n.title && k === 'note' && <header className="mn-note-title">{head}</header>}
      <div className="mn-box-body">
        {hideBody ? (
          <div className="mn-write-space" style={{ height: `${lines * 1.9}em` }} aria-label={T.space} />
        ) : style === 'side' ? (
          inlineRemark ? (
            <>
              <p className="mn-p">
                <span className="mn-side-title">{n.title ? <span {...H(titleHtml)} /> : label}</span>{' '}
                <span {...H(inline((n.children[0] as any).text, doc.labels))} />
              </p>
              <Nodes nodes={n.children.slice(1)} ctx={ctx} />
            </>
          ) : (
            <>
              <p className="mn-side-title mn-side-title-block">{n.title ? <span {...H(titleHtml)} /> : label}</p>
              <Nodes nodes={n.children} ctx={ctx} />
            </>
          )
        ) : (
          <Nodes nodes={n.children} ctx={ctx} />
        )}
        {k === 'proof' && !hideBody && <span className="mn-qed">∎</span>}
      </div>
    </section>
  )
}

function Outcomes({ outcomes, plan, ctx }: { outcomes: Extract<Node, { t: 'block' }>; plan: Extract<Node, { t: 'timeplan' }>; ctx: Ctx }) {
  const items = outcomes.children.flatMap((c) => (c.t === 'list' ? c.items : [[c]]))
  return (
    <div className="mn-outcomes reveal">
      <div>
        <p className="mn-out-title">{ctx.ar ? SHEET_T.ar.outcomes : SHEET_T.en.outcomes}</p>
        <ul className="mn-list mn-list-arrow">
          {items.map((it, k) => (
            <li key={k}>
              <Nodes nodes={it} ctx={ctx} />
            </li>
          ))}
        </ul>
      </div>
      <div className="mn-out-sep" />
      <TimePlan rows={plan.rows} ctx={ctx} inBox />
    </div>
  )
}

function TimePlan({ rows, ctx, inBox }: { rows: { range: string; text: string }[]; ctx: Ctx; inBox?: boolean }) {
  return (
    <div className={inBox ? 'mn-plan' : 'mn-outcomes mn-plan reveal'}>
      <p className="mn-out-title">{ctx.ar ? SHEET_T.ar.plan : SHEET_T.en.plan}</p>
      <table>
        <tbody>
          {rows.map((r, k) => (
            <tr key={k}>
              <td className="mn-plan-range"><bdi dir="ltr">{r.range}</bdi></td>
              <td {...H(inline(r.text, ctx.doc.labels))} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const al = (a: 'l' | 'c' | 'r') => (a === 'c' ? 'center' : a === 'r' ? 'right' : 'left')
function toRoman(n: number) {
  return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n] || String(n)
}

function watermarkUrl(text: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><text x="20" y="120" transform="rotate(-28 160 100)" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#0B3A6B" fill-opacity="0.075">${esc(text)}</text></svg>`
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`
}

/** table of contents (## headings) — used by the toolbar in the page header */
export function sheetToc(doc: Doc) {
  return doc.nodes.filter((n): n is Extract<Node, { t: 'h2' }> => n.t === 'h2').map((n) => ({ id: n.id, html: inline(n.text, doc.labels) }))
}

export default function Sheet({
  doc,
  mode,
  watermark,
  courseName,
  footer,
  pyLive = false,
  bare = false,
}: {
  doc: Doc
  /** print/PDF page: no reading chrome around the sheet */
  bare?: boolean
  mode: SheetMode
  /** admin: run missing Python figures in the browser ('upload' also stores them) */
  pyLive?: PyLiveMode
  watermark?: string | null
  courseName?: string
  footer?: string
}) {
  const m = doc.meta
  const toc = doc.nodes.filter((n): n is Extract<Node, { t: 'h2' }> => n.t === 'h2').map((n) => ({ id: n.id, html: inline(n.text, doc.labels) }))
  const ar = m.lang === 'ar'
  const T = ar ? SHEET_T.ar : SHEET_T.en
  const article = (
      <article className={`mn-sheet ${ar ? 'mn-ar' : ''}`} dir={ar ? 'rtl' : 'ltr'} lang={ar ? 'ar' : 'en'}>
        {watermark && <div className="mn-watermark" style={{ backgroundImage: watermarkUrl(watermark) }} aria-hidden />}
        <header className="mn-running">
          <span>
            {m.course || courseName} {m.chapter && <>| {T.chapter} {m.chapter}</>}
          </span>
          <span>
            {mode === 'doctor' ? T.solved : T.student} {m.lecture && <>| {T.lecture} {m.lecture}</>}
          </span>
        </header>

        <div className="mn-banner">
          <div className="mn-banner-top">
            <span>
              {m.chapter && <>{T.chapter} {m.chapter}</>}
              {m.chapter_title && <> • {m.chapter_title}</>}
            </span>
            <span>
              {m.lecture && <>{T.lecture} {m.lecture}</>}
              {m.duration && <> • {m.duration} {T.minutes}</>}
            </span>
          </div>
          <h1 className="mn-banner-title" {...H(inline(m.title || 'Lecture', doc.labels))} />
          <svg className="mn-banner-art" viewBox="0 0 300 80" aria-hidden>
            <path d="M0 60 C 40 10, 80 10, 120 40 S 200 75, 240 30 S 290 10, 300 20" />
            <path d="M0 70 C 50 40, 90 50, 130 55 S 210 20, 300 45" />
          </svg>
        </div>

        <Nodes nodes={doc.nodes} ctx={{ doc, mode, ar, pyLive }} />

        <footer className="mn-foot">
          {footer || T.footer(m.author || (ar ? 'أ.د. أحمد العجو' : 'Prof. Ahmad El-Ajou'))}
          {watermark && <span className="mn-foot-lic"> · {T.licensed} <bdi dir="ltr">{watermark}</bdi></span>}
        </footer>
      </article>
  )
  if (bare) return article
  return (
    <SheetChrome toc={toc} mode={mode} ar={ar}>
      {article}
    </SheetChrome>
  )
}
