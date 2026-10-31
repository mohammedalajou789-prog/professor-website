'use client'

import { PY_PRELUDE } from './prelude'

/**
 * Runs ```pyplot figures with real Python (Pyodide: numpy, matplotlib, mpmath, scipy, sympy…)
 * inside a Web Worker in the admin's browser. Output = SVG text.
 * Students never run Python: the SVG is uploaded to R2 once and inlined into the sheet.
 */

const DEFAULT_BASES = ['0.29.5', '0.29.3', '0.28.3'].map((v) => `https://cdn.jsdelivr.net/pyodide/v${v}/full/`)
const BASES = process.env.NEXT_PUBLIC_PYODIDE_BASE ? [process.env.NEXT_PUBLIC_PYODIDE_BASE] : DEFAULT_BASES

const WORKER_SRC = `
let py = null, booting = null;
async function boot(bases, prelude) {
  let last = null;
  for (const base of bases) {
    try {
      postMessage({ progress: 'Downloading Python (first time only, ~30 MB)…' });
      importScripts(base + 'pyodide.js');
      py = await loadPyodide({ indexURL: base });
      break;
    } catch (e) { last = e; py = null; }
  }
  if (!py) throw new Error('Could not load Python: ' + (last && last.message || last));
  postMessage({ progress: 'Loading numpy, matplotlib…' });
  await py.loadPackage(['numpy', 'matplotlib', 'mpmath']);
  postMessage({ progress: 'Preparing the sheet style…' });
  py.runPython(prelude);
}
onmessage = async (e) => {
  const { id, code, bases, prelude } = e.data;
  try {
    booting = booting || boot(bases, prelude);
    await booting;
    postMessage({ progress: 'Running Python…' });
    await py.loadPackagesFromImports(code);
    py.globals.set('__mn_code', code);
    const svg = py.runPython('__mn_run(__mn_code)');
    postMessage({ id, svg });
  } catch (err) {
    let msg = String((err && err.message) || err);
    const m = msg.match(/RuntimeError: ([\\s\\S]*)$/);
    if (m) msg = m[1];
    else if (msg.includes('Traceback')) msg = msg.trim().split('\\n').slice(-2).join('\\n');
    if (!py) booting = null;
    postMessage({ id, error: msg.trim() });
  }
};
`

type Pending = { resolve: (svg: string) => void; reject: (e: Error) => void; timer: any }
let worker: Worker | null = null
let seq = 0
const pending = new Map<number, Pending>()
let queue: Promise<unknown> = Promise.resolve()
const listeners = new Set<(p: string) => void>()

function getWorker() {
  if (worker) return worker
  const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }))
  worker = new Worker(url)
  worker.onmessage = (e) => {
    const d = e.data
    if (d.progress) return listeners.forEach((l) => l(d.progress))
    const p = pending.get(d.id)
    if (!p) return
    pending.delete(d.id)
    clearTimeout(p.timer)
    if (d.error) p.reject(new Error(d.error))
    else p.resolve(d.svg)
  }
  return worker
}

function kill(reason: string) {
  worker?.terminate()
  worker = null
  for (const [, p] of pending) { clearTimeout(p.timer); p.reject(new Error(reason)) }
  pending.clear()
}

/** Run one figure. Calls are serialised (matplotlib state is global). */
export function runPy(code: string, onProgress?: (msg: string) => void): Promise<string> {
  const job = async () => {
    if (onProgress) listeners.add(onProgress)
    try {
      return await new Promise<string>((resolve, reject) => {
        const id = ++seq
        // first run downloads Python → generous limit; an endless loop is stopped after it.
        const timer = setTimeout(() => kill('Timed out (180 s). Check the code for an endless loop or a very large computation.'), 180_000)
        pending.set(id, { resolve, reject, timer })
        getWorker().postMessage({ id, code, bases: BASES, prelude: PY_PRELUDE })
      })
    } finally {
      if (onProgress) listeners.delete(onProgress)
    }
  }
  const p = queue.then(job, job)
  queue = p.catch(() => {})
  return p
}

/**
 * Make an SVG safe to inline next to other figures:
 * unique ids (prefix), page-wide <style> moved onto the root element, no XML prolog.
 */
export function scopeSvg(svg: string, hash: string) {
  const P = `f${hash.slice(0, 10)}-`
  return svg
    .replace(/<\?xml[^>]*\?>\s*/g, '')
    .replace(/<!DOCTYPE[^>]*>\s*/gi, '')
    .replace(/<metadata>[\s\S]*?<\/metadata>\s*/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>\s*/g, '')
    .replace(/<svg\b/, '<svg style="stroke-linejoin:round;stroke-linecap:butt"')
    .replace(/\bid="([^"]+)"/g, `id="${P}$1"`)
    .replace(/((?:xlink:)?href)="#([^"]+)"/g, `$1="#${P}$2"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${P}$1)`)
}
