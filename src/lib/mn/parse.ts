/**
 * MN Syntax v1 parser → AST (pure TS, runs on the server).
 * See MN_SYNTAX_SPEC.md for the language.
 */
export type Meta = {
  course?: string
  chapter?: string
  chapter_title?: string
  lecture?: string
  title?: string
  duration?: string
  lang?: 'en' | 'ar'
  author?: string
  [k: string]: string | undefined
}

export type Node =
  | { t: 'h2'; text: string; id: string }
  | { t: 'h3'; text: string }
  | { t: 'p'; text: string }
  | { t: 'math'; tex: string; label?: string; num?: string; tag?: string }
  | { t: 'list'; style: 'bullet' | 'num' | 'paren' | 'arrow' | 'roman'; items: Node[][] }
  | { t: 'block'; kind: string; title?: string; label?: string; num?: string; attrs: Record<string, string>; children: Node[] }
  | { t: 'mcq'; questions: MCQ[] }
  | { t: 'fig'; kind: string; attrs: Record<string, string>; body: string }
  | { t: 'py'; code: string; hash: string; attrs: Record<string, string>; svg?: string | null }
  | { t: 'rowops'; attrs: Record<string, string>; body: string }
  | { t: 'table'; head: string[]; rows: string[][]; align: ('l' | 'c' | 'r')[] }
  | { t: 'timeplan'; rows: { range: string; text: string }[] }
  | { t: 'columns'; cols: Node[][] }
  | { t: 'steps'; steps: Node[][] }
  | { t: 'image'; src: string; caption: string; width?: string }
  | { t: 'video'; id: string; start?: string }
  | { t: 'desmos'; url: string }
  | { t: 'pagebreak' }
  | { t: 'hr' }

export type MCQ = { q: string; options: { text: string; correct: boolean }[]; explain?: string }

export type Doc = { meta: Meta; nodes: Node[]; labels: Record<string, { text: string; id: string }>; errors: string[] }

/** Bump when the Python figure style (src/lib/py/prelude.ts) changes → all Python figures regenerate. */
export const PY_STYLE_VERSION = 'py1'
const PY_KINDS = new Set(['pyplot', 'python', 'py', 'matplotlib'])

/** remove common indentation + trailing spaces (Python is indentation-sensitive) */
export function dedent(code: string) {
  const lines = code.replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n').map((l) => l.replace(/\s+$/, ''))
  while (lines.length && !lines[0]) lines.shift()
  while (lines.length && !lines[lines.length - 1]) lines.pop()
  const ind = Math.min(...lines.filter((l) => l).map((l) => l.match(/^ */)![0].length))
  return lines.map((l) => l.slice(Number.isFinite(ind) ? ind : 0)).join('\n')
}

/** stable, synchronous content hash (same result on server and in the browser) */
export function pyHash(code: string) {
  const str = `${PY_STYLE_VERSION}\n${code}`
  const h = (seed: number) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36).padStart(11, '0')
  }
  return h(1) + h(7)
}

/** every Python figure in a document (any depth) */
export function collectPy(doc: Doc) {
  const out: Extract<Node, { t: 'py' }>[] = []
  const walk = (ns: Node[]) => ns.forEach((n) => {
    if (n.t === 'py') out.push(n)
    else if (n.t === 'block') walk(n.children)
    else if (n.t === 'list') n.items.forEach(walk)
    else if (n.t === 'steps') n.steps.forEach(walk)
    else if (n.t === 'columns') n.cols.forEach(walk)
  })
  walk(doc.nodes)
  return out
}

const FIG_KINDS = new Set(['plot', 'field', 'plot3d', 'geometry', 'vectors', 'numberline', 'complex', 'signchart', 'variation', 'stats', 'tree', 'venn', 'graph', 'diagram'])
const NUMBERED: Record<string, string> = {
  definition: 'definition',
  theorem: 'theorem', lemma: 'theorem', corollary: 'theorem', proposition: 'theorem',
  example: 'example',
}

/** parse `::: kind "Title" {#label key=val flag}` header */
function parseHeader(rest: string) {
  const m = rest.match(/^([\w-]+)\s*(.*)$/)!
  const kind = m[1].toLowerCase()
  let tail = m[2] || ''
  let title: string | undefined
  const tm = tail.match(/^"((?:[^"\\]|\\.)*)"\s*/)
  if (tm) {
    title = tm[1]
    tail = tail.slice(tm[0].length)
  }
  const attrs: Record<string, string> = {}
  let label: string | undefined
  // 1) quoted values first (they may contain braces/LaTeX), 2) then {#label ...} groups, 3) bare tokens
  tail = tail.replace(/([\w-]+)="((?:[^"\\]|\\.)*)"/g, (_, k, v) => {
    attrs[k] = v
    return ' '
  })
  tail = tail.replace(/[{}]/g, ' ')
  tail.replace(/#([\w:.-]+)|([\w-]+)=(\S+)|([\w-]+)/g, (_, lab, k, v, flag) => {
    if (lab) label = lab
    else if (k) attrs[k] = v
    else if (flag) attrs[flag] = 'true'
    return ''
  })
  return { kind, title, label, attrs }
}

function slug(s: string) {
  return s.toLowerCase().replace(/\$[^$]*\$/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section'
}

export function parseMN(src: string): Doc {
  const errors: string[] = []
  const text = src.replace(/\r\n?/g, '\n').replace(/\t/g, '  ')
  let lines = text.split('\n')
  const meta: Meta = {}

  // front matter
  if (lines[0]?.trim() === '---') {
    const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
    if (end > 0) {
      for (const l of lines.slice(1, end)) {
        const m = l.match(/^\s*([\w-]+)\s*:\s*(.*?)\s*(#.*)?$/)
        if (m) meta[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
      lines = lines.slice(end + 1)
    }
  }
  if (meta.lang !== 'ar') meta.lang = 'en'

  const L = meta.lecture || meta.chapter || '1'
  const counters: Record<string, number> = {}
  const labels: Doc['labels'] = {}
  const usedIds = new Set<string>()

  const nextNum = (group: string) => {
    counters[group] = (counters[group] || 0) + 1
    return `${L}.${counters[group]}`
  }

  function parseBlockLines(ls: string[], ctx: string[] = []): Node[] {
    const out: Node[] = []
    let i = 0
    let para: string[] = []
    const flush = () => {
      if (para.length) {
        out.push({ t: 'p', text: para.join(' ').trim() })
        para = []
      }
    }

    while (i < ls.length) {
      const raw = ls[i]
      const line = raw.trim()

      if (!line) { flush(); i++; continue }

      // ---------- fenced figure / rowops ----------
      const fence = line.match(/^```\s*([\w-]+)?\s*(.*)$/)
      if (fence) {
        flush()
        const kind = (fence[1] || '').toLowerCase()
        const body: string[] = []
        i++
        while (i < ls.length && !ls[i].trim().startsWith('```')) body.push(ls[i++])
        i++
        const { attrs } = parseHeader(`x ${fence[2] || ''}`)
        if (kind === 'rowops') out.push({ t: 'rowops', attrs, body: body.join('\n') })
        else if (PY_KINDS.has(kind)) {
          const code = dedent(body.join('\n'))
          if (!code.trim()) errors.push('Empty ```pyplot block')
          out.push({ t: 'py', code, hash: pyHash(code), attrs })
        }
        else if (FIG_KINDS.has(kind)) out.push({ t: 'fig', kind, attrs, body: body.join('\n') })
        else if (kind === 'math' || kind === 'latex') out.push({ t: 'math', tex: body.join('\n') })
        else errors.push(`Unknown figure type "${kind}"`)
        continue
      }

      // ---------- block ::: ----------
      if (line.startsWith(':::')) {
        const rest = line.slice(3).trim()
        if (!rest) { i++; continue } // stray close (handled by caller)
        flush()
        const hdr = parseHeader(rest)
        // collect lines until matching close (respect nesting and fences)
        const inner: string[] = []
        let depth = 1
        let inFence = false
        i++
        while (i < ls.length) {
          const tl = ls[i].trim()
          if (tl.startsWith('```')) inFence = !inFence
          if (!inFence && tl.startsWith(':::')) {
            if (tl === ':::') { depth--; if (depth === 0) break }
            else depth++
          }
          inner.push(ls[i])
          i++
        }
        if (depth !== 0) errors.push(`Block "::: ${hdr.kind}" is not closed with ":::"`)
        i++
        out.push(buildBlock(hdr, inner, [...ctx, hdr.kind]))
        continue
      }

      // ---------- headings ----------
      if (/^##\s+/.test(line) && !line.startsWith('###')) {
        flush()
        const textH = line.replace(/^##\s+/, '')
        let id = slug(textH)
        while (usedIds.has(id)) id += '-x'
        usedIds.add(id)
        out.push({ t: 'h2', text: textH, id })
        i++; continue
      }
      if (/^###\s+/.test(line)) { flush(); out.push({ t: 'h3', text: line.replace(/^###\s+/, '') }); i++; continue }

      if (line === '---page---') { flush(); out.push({ t: 'pagebreak' }); i++; continue }
      if (line === '---') { flush(); out.push({ t: 'hr' }); i++; continue }
      if (line === '>>>') { flush(); out.push({ t: 'p', text: '\u0000STEP' }); i++; continue }

      // ---------- display math ----------
      if (line.startsWith('$$')) {
        flush()
        let buf = line.slice(2)
        let closed = false
        let after = ''
        const close = (s: string) => {
          const k = s.indexOf('$$')
          if (k >= 0) { after = s.slice(k + 2); buf = buf.slice(0, buf.length - (s.length - k)); closed = true }
        }
        close(buf)
        i++
        while (!closed && i < ls.length) {
          buf += '\n' + ls[i]
          close(ls[i])
          i++
        }
        if (!closed) errors.push('Display math "$$" is not closed')
        const lm = after.match(/\{#([\w:.-]+)\}/)
        const node: Node = { t: 'math', tex: buf.trim() }
        if (lm) {
          node.label = lm[1]
          node.num = `(${nextNum('eq')})`
          labels[lm[1]] = { text: node.num.replace(/[()]/g, ''), id: lm[1] }
        }
        const tagm = after.match(/\{tag=([^}]*)\}/)
        if (tagm) node.tag = tagm[1]
        out.push(node)
        continue
      }

      // ---------- media ----------
      const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+width=(\S+))?\)$/)
      if (img) { flush(); out.push({ t: 'image', caption: img[1], src: img[2], width: img[3] }); i++; continue }
      const vid = line.match(/^@video\(\s*(?:youtube:)?([\w-]{6,})(?:\s+start=(\d+))?\s*\)$/)
      if (vid) { flush(); out.push({ t: 'video', id: vid[1], start: vid[2] }); i++; continue }
      const des = line.match(/^@desmos\(\s*(https:\/\/www\.desmos\.com\/calculator\/[\w]+)\s*\)$/)
      if (des) { flush(); out.push({ t: 'desmos', url: des[1] }); i++; continue }

      // ---------- table ----------
      if (line.startsWith('|') && ls[i + 1]?.trim().match(/^\|?\s*:?-{2,}/)) {
        flush()
        const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim())
        const head = cells(line)
        const align = cells(ls[i + 1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'c' : c.endsWith(':') ? 'r' : 'l')) as ('l' | 'c' | 'r')[]
        i += 2
        const rows: string[][] = []
        while (i < ls.length && ls[i].trim().startsWith('|')) rows.push(cells(ls[i++]))
        out.push({ t: 'table', head, rows, align })
        continue
      }

      // ---------- lists ----------
      const lm = raw.match(/^(\s*)([-*•]|\d+[.)]|\(\d+\)|\([a-z]\)|►|>>|[ivx]+\.)\s+(.*)$/)
      if (lm && !line.startsWith('>>>')) {
        flush()
        const marker = lm[2]
        const style: 'bullet' | 'num' | 'paren' | 'arrow' | 'roman' =
          /^\(\d+\)$/.test(marker) || /^\([a-z]\)$/.test(marker) ? 'paren' : /^\d/.test(marker) ? 'num' : marker === '►' || marker === '>>' ? 'arrow' : /^[ivx]+\.$/.test(marker) ? 'roman' : 'bullet'
        const baseIndent = lm[1].length
        const items: { marker: string; lines: string[] }[] = []
        while (i < ls.length) {
          const r = ls[i]
          const m2 = r.match(/^(\s*)([-*•]|\d+[.)]|\(\d+\)|\([a-z]\)|►|>>|[ivx]+\.)\s+(.*)$/)
          if (m2 && m2[1].length === baseIndent && !r.trim().startsWith('>>>')) {
            items.push({ marker: m2[2], lines: [m2[3]] })
            i++
            continue
          }
          if (!r.trim()) {
            // blank: continue only if next non-blank line is indented deeper (continuation)
            const nxt = ls.slice(i + 1).find((x) => x.trim())
            if (nxt && nxt.match(/^(\s*)/)![1].length > baseIndent) { items[items.length - 1].lines.push(''); i++; continue }
            break
          }
          const ind = r.match(/^(\s*)/)![1].length
          if (ind > baseIndent || (items.length && !r.trim().startsWith(':::') && !r.trim().startsWith('$$') && !r.trim().startsWith('#') && ind === baseIndent && false)) {
            items[items.length - 1].lines.push(r.slice(Math.min(ind, baseIndent + 2)))
            i++
            continue
          }
          break
        }
        out.push({ t: 'list', style, items: items.map((it) => parseBlockLines(it.lines, ctx)) })
        continue
      }

      para.push(line)
      i++
    }
    flush()
    return out
  }

  function buildBlock(hdr: ReturnType<typeof parseHeader>, inner: string[], ctx: string[]): Node {
    const { kind, title, label, attrs } = hdr
    if (kind === 'mcq') return { t: 'mcq', questions: parseMCQ(inner) }
    if (kind === 'timeplan') {
      const rows = inner.map((l) => l.trim()).filter(Boolean).map((l) => {
        const [r, ...txt] = l.split('|')
        return { range: r.trim().replace(/-/g, '–'), text: txt.join('|').trim() }
      })
      return { t: 'timeplan', rows }
    }
    if (kind === 'columns') {
      const cols: string[][] = [[]]
      for (const l of inner) (l.trim() === '+++' ? cols.push([]) : cols[cols.length - 1].push(l))
      return { t: 'columns', cols: cols.map((c) => parseBlockLines(c, ctx)) }
    }
    let children = parseBlockLines(inner, ctx)
    // steps: split children at ">>>" markers
    if (attrs.steps || children.some((c) => c.t === 'p' && c.text === '\u0000STEP')) {
      const steps: Node[][] = [[]]
      for (const c of children) (c.t === 'p' && c.text === '\u0000STEP' ? steps.push([]) : steps[steps.length - 1].push(c))
      children = [{ t: 'steps', steps: steps.filter((s) => s.length) }]
      attrs.steps = 'true'
    }
    const node: Node = { t: 'block', kind, title, label, attrs, children }
    const group = NUMBERED[kind]
    if (group && !attrs.nonum) {
      node.num = nextNum(group)
      const AR: Record<string, string> = { definition: 'تعريف', theorem: 'مبرهنة', lemma: 'تمهيدية', corollary: 'نتيجة', proposition: 'قضية', example: 'مثال' }
      const name = meta.lang === 'ar' ? AR[kind] || kind : kind[0].toUpperCase() + kind.slice(1)
      if (label) labels[label] = { text: `${name} ${node.num}`, id: label }
    } else if (label) {
      labels[label] = { text: title || kind, id: label }
    }
    return node
  }

  function parseMCQ(inner: string[]): MCQ[] {
    const qs: MCQ[] = []
    let cur: MCQ | null = null
    let mode: 'q' | 'o' | 'e' = 'q'
    for (const raw of inner) {
      const l = raw.trim()
      if (!l) continue
      const qm = l.match(/^Q\d*[:.]\s*(.*)$/)
      if (qm) { cur = { q: qm[1], options: [] }; qs.push(cur); mode = 'q'; continue }
      if (!cur) continue
      const om = l.match(/^(?:-|\([a-z]\)|[a-z]\))\s+(.*?)(\s+\*)?$/)
      if (om) { cur.options.push({ text: om[1].trim(), correct: !!om[2] }); mode = 'o'; continue }
      if (l.startsWith('>')) { cur.explain = (cur.explain ? cur.explain + ' ' : '') + l.replace(/^>\s*/, ''); mode = 'e'; continue }
      if (mode === 'q') cur.q += ' ' + l
      else if (mode === 'o' && cur.options.length) cur.options[cur.options.length - 1].text += ' ' + l
      else if (mode === 'e') cur.explain += ' ' + l
    }
    for (const [k, q] of qs.entries()) if (!q.options.some((o) => o.correct)) errors.push(`MCQ ${k + 1}: no option marked correct with *`)
    return qs
  }

  const nodes = parseBlockLines(lines)

  // unresolved refs
  const refRe = /(?<![\w\\])@([a-z]+:[\w.-]+)/g
  for (const m of text.matchAll(refRe)) if (!labels[m[1]]) errors.push(`Reference @${m[1]} has no matching {#${m[1]}}`)

  return { meta, nodes, labels, errors }
}
