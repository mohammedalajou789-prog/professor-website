export type Pub = {
  id: string
  title_en: string
  authors: string
  journal_name: string | null
  year: number
  volume: string | null
  issue: string | null
  pages: string | null
  abstract_en?: string | null
  doi: string | null
  scholar_url: string | null
  journal_url?: string | null
  citation_count: number | null
  pub_type: string | null
  is_featured?: boolean | null
}

export function hIndex(c: number[]) {
  const s = [...c].sort((a, b) => b - a)
  let h = 0
  for (let i = 0; i < s.length; i++) if (s[i] >= i + 1) h = i + 1
  return h
}

/** Metrics from the DB, overridden by the manual Google-Scholar numbers in `profile` when present. */
export function pubStats(pubs: Pub[], profile?: Record<string, any> | null) {
  const cites = pubs.map((p) => p.citation_count || 0)
  const computedCitations = cites.reduce((a, b) => a + b, 0)
  const years = pubs.map((p) => p.year).filter(Boolean)
  return {
    count: pubs.length,
    citations: Number(profile?.citations_total) || computedCitations,
    h: Number(profile?.h_index) || hIndex(cites),
    i10: Number(profile?.i10_index) || cites.filter((c) => c >= 10).length,
    journals: new Set(pubs.map((p) => p.journal_name).filter(Boolean)).size,
    since: years.length ? Math.min(...years) : new Date().getFullYear(),
    perYear: years.reduce<Record<number, number>>((acc, y) => ((acc[y] = (acc[y] || 0) + 1), acc), {}),
  }
}

export function citation(p: Pub) {
  let s = `${p.authors} (${p.year}). ${p.title_en}.`
  if (p.journal_name) s += ` ${p.journal_name}`
  if (p.volume) s += `, ${p.volume}`
  if (p.issue) s += `(${p.issue})`
  if (p.pages) s += `, ${p.pages}`
  s += '.'
  if (p.doi) s += ` https://doi.org/${p.doi}`
  return s
}

const BIB_TYPE: Record<string, string> = { article: 'article', journal: 'article', conference: 'inproceedings', book: 'book', chapter: 'incollection', thesis: 'phdthesis' }
const esc = (s: string) => s.replace(/([&%$#_{}])/g, '\\$1')

export function bibtex(pubs: Pub[]) {
  const used = new Set<string>()
  return pubs
    .map((p) => {
      const last = (p.authors.split(',')[0] || 'ref').trim().split(/\s+/).pop()!.replace(/[^a-zA-Z]/g, '') || 'ref'
      let key = `${last}${p.year}`
      let k = 0
      while (used.has(key)) key = `${last}${p.year}${String.fromCharCode(97 + k++)}`
      used.add(key)
      const type = BIB_TYPE[(p.pub_type || 'article').toLowerCase()] || 'article'
      const venue = type === 'inproceedings' ? 'booktitle' : type === 'book' ? 'publisher' : 'journal'
      const f = [
        `  author = {${esc(p.authors)}}`,
        `  title = {${esc(p.title_en)}}`,
        p.journal_name && `  ${venue} = {${esc(p.journal_name)}}`,
        `  year = {${p.year}}`,
        p.volume && `  volume = {${p.volume}}`,
        p.issue && `  number = {${p.issue}}`,
        p.pages && `  pages = {${p.pages}}`,
        p.doi && `  doi = {${p.doi}}`,
      ].filter(Boolean)
      return `@${type}{${key},\n${f.join(',\n')}\n}`
    })
    .join('\n\n')
}
