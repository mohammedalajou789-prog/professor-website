/**
 * Tiny, safe math-expression compiler for MN figures (no eval).
 * Supports: + - * / ^, unary -, implicit multiplication (2x, 3(x+1), xy),
 * comparisons < > <= >= == (→ 1/0), functions, constants pi/e, and if(c,a,b).
 */
export type Env = Record<string, number>
export type Fn = (env: Env) => number

const FUNCS: Record<string, (...a: number[]) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x),
  asin: Math.asin, acos: Math.acos, atan: Math.atan, arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  atan2: Math.atan2,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2,
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round,
  sign: Math.sign, sgn: Math.sign, min: Math.min, max: Math.max, pow: Math.pow,
  gamma: gammaFn,
  fact: (n) => gammaFn(n + 1),
  if: (c, a, b) => (c ? a : b),
  heaviside: (x) => (x >= 0 ? 1 : 0),
  ml: (a, z) => mittagLeffler(a, 1, z),
  ml2: (a, b, z) => mittagLeffler(a, b, z),
}
const CONSTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E, tau: 2 * Math.PI, inf: Infinity }

export function gammaFn(z: number): number {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z))
  z -= 1
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  let x = c[0]
  for (let i = 1; i < 9; i++) x += c[i] / (z + i)
  const t = z + 7.5
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x
}
export function mittagLeffler(a: number, b: number, z: number) {
  let s = 0
  for (let k = 0; k < 100; k++) {
    const term = Math.pow(z, k) / gammaFn(a * k + b)
    if (!isFinite(term)) break
    s += term
    if (Math.abs(term) < 1e-12 && k > 5) break
  }
  return s
}

type Tok = { k: 'num' | 'id' | 'op' | '(' | ')' | ','; v: string }

function tokenize(src: string, vars: Set<string>): Tok[] {
  const s = src.replace(/·|×/g, '*').replace(/−/g, '-').replace(/\*\*/g, '^').replace(/\\(pi|theta|alpha|beta|lambda|mu|omega|sigma|tau)/g, '$1')
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) { i++; continue }
    if (/[0-9.]/.test(c)) {
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i)!
      out.push({ k: 'num', v: m[0] }); i += m[0].length; continue
    }
    if (/[A-Za-zα-ωπθ_]/.test(c)) {
      const m = s.slice(i).match(/^[A-Za-zα-ωπθ_][A-Za-z0-9α-ωπθ_']*/)!
      const w = m[0]
      if (FUNCS[w] !== undefined || CONSTS[w] !== undefined || vars.has(w)) out.push({ k: 'id', v: w })
      else {
        // split "xy" / "2pi x" style products into known single symbols
        let rest = w
        while (rest) {
          const hit = [...vars, ...Object.keys(CONSTS), ...Object.keys(FUNCS)].filter((n) => rest.startsWith(n)).sort((a, b) => b.length - a.length)[0]
          if (!hit) throw new Error(`Unknown symbol "${rest}" in ${src}`)
          out.push({ k: 'id', v: hit }); rest = rest.slice(hit.length)
        }
      }
      i += w.length; continue
    }
    const two = s.slice(i, i + 2)
    if (['<=', '>=', '==', '!='].includes(two)) { out.push({ k: 'op', v: two }); i += 2; continue }
    if ('+-*/^<>!'.includes(c)) { out.push({ k: 'op', v: c }); i++; continue }
    if (c === '(' || c === '[' || c === '{') { out.push({ k: '(', v: '(' }); i++; continue }
    if (c === ')' || c === ']' || c === '}') { out.push({ k: ')', v: ')' }); i++; continue }
    if (c === ',') { out.push({ k: ',', v: ',' }); i++; continue }
    if (c === '|') { out.push({ k: 'op', v: '|' }); i++; continue }
    throw new Error(`Unexpected "${c}" in ${src}`)
  }
  // implicit multiplication
  const res: Tok[] = []
  for (let j = 0; j < out.length; j++) {
    const a = res[res.length - 1], b = out[j]
    if (a && ((a.k === 'num' || a.k === ')' || (a.k === 'id' && FUNCS[a.v] === undefined)) && (b.k === 'num' || b.k === '(' || b.k === 'id'))) {
      if (!(a.k === 'num' && b.k === 'num')) res.push({ k: 'op', v: '*' })
    }
    res.push(b)
  }
  return res
}

/** Pratt parser producing a closure tree */
export function compile(src: string, varNames: string[] = ['x']): Fn {
  const vars = new Set(varNames)
  const toks = tokenize(src, vars)
  let p = 0
  const peek = () => toks[p]
  const next = () => toks[p++]
  const BP: Record<string, number> = { '<': 1, '>': 1, '<=': 1, '>=': 1, '==': 1, '!=': 1, '+': 2, '-': 2, '*': 3, '/': 3, '^': 5 }

  function nud(): Fn {
    const t = next()
    if (!t) throw new Error('Unexpected end of expression: ' + src)
    if (t.k === 'num') { const v = parseFloat(t.v); return () => v }
    if (t.k === 'op' && t.v === '-') { const a = expr(4); return (e) => -a(e) }
    if (t.k === 'op' && t.v === '+') return expr(4)
    if (t.k === 'op' && t.v === '|') { const a = expr(0); if (next()?.v !== '|') throw new Error('Missing | in ' + src); return (e) => Math.abs(a(e)) }
    if (t.k === '(') { const a = expr(0); next(); return a }
    if (t.k === 'id') {
      if (FUNCS[t.v] && peek()?.k === '(') {
        next()
        const args: Fn[] = []
        if (peek()?.k !== ')') {
          args.push(expr(0))
          while (peek()?.k === ',') { next(); args.push(expr(0)) }
        }
        next()
        const f = FUNCS[t.v]
        if (t.v === 'if') return (e) => (args[0](e) ? args[1](e) : args[2] ? args[2](e) : NaN)
        return (e) => f(...args.map((a) => a(e)))
      }
      if (FUNCS[t.v]) { // sin x  (no parentheses)
        const a = expr(4); const f = FUNCS[t.v]; return (e) => f(a(e))
      }
      if (CONSTS[t.v] !== undefined) { const v = CONSTS[t.v]; return () => v }
      const name = t.v
      return (e) => e[name]
    }
    throw new Error(`Unexpected "${t.v}" in ${src}`)
  }
  function expr(rbp: number): Fn {
    let left = nud()
    while (true) {
      const t = peek()
      if (!t || t.k !== 'op' || t.v === '|') break
      if (t.v === '!') { next(); const a = left; left = (e) => gammaFn(a(e) + 1); continue }
      const bp = BP[t.v]
      if (bp === undefined || bp <= rbp) break
      next()
      const right = expr(t.v === '^' ? bp - 1 : bp)
      const a = left
      switch (t.v) {
        case '+': left = (e) => a(e) + right(e); break
        case '-': left = (e) => a(e) - right(e); break
        case '*': left = (e) => a(e) * right(e); break
        case '/': left = (e) => a(e) / right(e); break
        case '^': left = (e) => Math.pow(a(e), right(e)); break
        case '<': left = (e) => +(a(e) < right(e)); break
        case '>': left = (e) => +(a(e) > right(e)); break
        case '<=': left = (e) => +(a(e) <= right(e)); break
        case '>=': left = (e) => +(a(e) >= right(e)); break
        case '==': left = (e) => +(Math.abs(a(e) - right(e)) < 1e-9); break
        case '!=': left = (e) => +(Math.abs(a(e) - right(e)) >= 1e-9); break
      }
    }
    return left
  }
  const f = expr(0)
  if (p < toks.length) throw new Error(`Could not parse "${src}"`)
  return f
}

/** evaluate a constant expression such as "pi/2" or "sqrt(5)" */
export function num(src: string | number | undefined, fallback = 0): number {
  if (src === undefined || src === '') return fallback
  if (typeof src === 'number') return src
  try {
    const v = compile(String(src), [])({})
    return isFinite(v) ? v : fallback
  } catch {
    return fallback
  }
}

/** "[-2*pi, 2*pi]" → [a, b] */
export function range(src: string | undefined, fallback: [number, number]): [number, number] {
  if (!src) return fallback
  const m = src.replace(/^\[|\]$/g, '').split(',')
  if (m.length !== 2) return fallback
  return [num(m[0], fallback[0]), num(m[1], fallback[1])]
}

/** parse key=value options (values may be "quoted", [bracketed] or bare); bare words become flags */
export function parseOpts(src: string): { opts: Record<string, string>; rest: string } {
  const opts: Record<string, string> = {}
  const re = /([A-Za-z_][\w-]*)=("([^"]*)"|\[[^\]]*\]|\([^)]*\)|\S+)/g
  const rest = src.replace(re, (_, k, v, q) => {
    opts[k] = q !== undefined ? q : v
    return ' '
  })
  let r = rest.trim()
  // trailing bare flags: "f(x) = sin(x) dash", "point (1,2) open"
  let m: RegExpMatchArray | null
  while ((m = r.match(/\s+(dash|dashed|dotted|open|closed|guides|bold|thin|hidden)$/))) {
    opts[m[1] === 'dashed' || m[1] === 'dotted' ? 'dash' : m[1]] = 'true'
    r = r.slice(0, r.length - m[0].length).trim()
  }
  return { opts, rest: r }
}
