// Regenerates src/lib/mn/samples.ts from docs/mn/*.mn  →  node scripts/gen-samples.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const list = [
  ['lecture1', 'Lecture 1', 'lecture-01.mn'],
  ['lecture4', 'Lecture 4', 'lecture-04.mn'],
  ['python', 'Python figures', 'python-figures.mn'],
  ['arabic', 'عربي', 'arabic-sample.mn'],
  ['showcase', 'Figure showcase', 'showcase.mn'],
  ['errors', 'Error check', 'errors-test.mn'],
]
let out = '// Generated from docs/mn/*.mn by scripts/gen-samples.mjs — reference sheets shown in the admin MN guide\nexport const SAMPLES: Record<string, { label: string; src: string }> = {\n'
for (const [k, label, f] of list) out += `  ${k}: { label: ${JSON.stringify(label)}, src: ${JSON.stringify(readFileSync(`docs/mn/${f}`, 'utf8'))} },\n`
writeFileSync('src/lib/mn/samples.ts', out + '}\n')
console.log('samples.ts written')
