import katex from 'katex'

export const MACROS: Record<string, string> = {
  '\\X': '\\mathbf{X}',
  '\\A': '\\mathbf{A}',
  '\\B': '\\mathbf{B}',
  '\\K': '\\mathbf{K}',
  '\\F': '\\mathbf{F}',
  '\\I': '\\mathbf{I}',
  '\\0': '\\mathbf{0}',
  '\\vb': '\\boldsymbol{#1}',
  '\\R': '\\mathbb{R}',
  '\\C': '\\mathbb{C}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
  '\\abs': '\\left|#1\\right|',
  '\\norm': '\\left\\|#1\\right\\|',
  '\\diag': '\\operatorname{diag}',
  '\\tr': '\\operatorname{tr}',
  '\\rank': '\\operatorname{rank}',
  '\\T': '^{T}',
  '\\D': 'D^{#1}',
  '\\Lap': '\\mathcal{L}',
  '\\dd': '\\mathrm{d}',
  '\\e': '\\mathrm{e}',
}

const cache = new Map<string, string>()

export function tex(src: string, display = false): string {
  const key = (display ? 'D' : 'I') + src
  const hit = cache.get(key)
  if (hit) return hit
  let html: string
  try {
    html = katex.renderToString(src, { displayMode: display, throwOnError: false, macros: { ...MACROS }, strict: 'ignore', trust: false, output: 'html' })
  } catch (e: any) {
    html = `<code class="mn-err" title="${esc(e?.message || '')}">${esc(src)}</code>`
  }
  if (cache.size > 4000) cache.clear()
  cache.set(key, html)
  return html
}

export function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Inline MN → HTML: $math$, **bold**, *italic*, [[term]], !!emphasis!!, @label refs, `code`, [link](url).
 * Math is protected first so markdown never touches it.
 */
export function inline(src: string, labels: Record<string, { text: string; id: string }> = {}): string {
  const math: string[] = []
  let s = src.replace(/\\\$/g, '\u0002')
  s = s.replace(/\$([^$]+)\$/g, (_, m) => {
    math.push(tex(m.replace(/\u0002/g, '\\$')))
    return `\u0001${math.length - 1}\u0001`
  })
  s = esc(s)
  s = s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[\[(.+?)\]\]/g, '<span class="mn-term">$1</span>')
    .replace(/!!(.+?)!!/g, '<span class="mn-red">$1</span>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*(?!\s)(.+?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/(^|[^\w\\])@([a-z]+:[\w.-]*\w)/g, (_, pre, lab) => {
      const l = labels[lab]
      return l ? `${pre}<a class="mn-ref" href="#${esc(l.id)}">${esc(l.text)}</a>` : `${pre}<span class="mn-ref mn-ref-missing">@${esc(lab)}</span>`
    })
    .replace(/\(eq:([\w.-]+)\)/g, (_, lab) => {
      const l = labels['eq:' + lab]
      return l ? `(<a class="mn-ref" href="#eq:${esc(lab)}">${l.text}</a>)` : `(${lab})`
    })
  s = s.replace(/\u0001(\d+)\u0001/g, (_, k) => math[+k]).replace(/\u0002/g, '$')
  return s
}
