// Regenerates src/lib/mn/samples.ts from docs/mn/*.mn  →  node scripts/gen-samples.mjs
import { readFileSync, writeFileSync } from 'node:fs'
const list = [
  ['lecture1', 'Full lecture example', 'lecture-01.mn', 'A complete lecture rebuilt from the doctor’s PDF (linear systems): every box type, numbered equations, solutions, MCQs. · محاضرة كاملة من شيت الدكتور الأصلي: كل أنواع الصناديق والحلول والأسئلة.'],
  ['lecture4', 'Second example (phase portraits)', 'lecture-04.mn', 'Eigenvalues and phase portraits, with an animated phase plane. · مثال ثانٍ: القيم الذاتية ومستوى الطور المتحرك.'],
  ['python', 'Python figures', 'python-figures.mn', 'Figures written in Python: Mittag-Leffler, fractional ODE solver, surfaces, phase planes, statistics. · رسومات مكتوبة ببايثون.'],
  ['arabic', 'Arabic sheet · شيت عربي', 'arabic-sample.mn', 'A sheet written in Arabic (lang: ar): Arabic headings, mathematics left-to-right. · شيت مكتوب بالعربية.'],
  ['showcase', 'Built-in animated figures', 'showcase.mn', 'Every built-in (animated / interactive) figure type. · كل أنواع الرسومات المدمجة المتحركة.'],
  ['errors', 'Error checker test', 'errors-test.mn', 'A file with deliberate mistakes — shows how errors are reported. · ملف فيه أخطاء متعمّدة لرؤية رسائل الخطأ.'],
]
let out = '// Generated from docs/mn/*.mn by scripts/gen-samples.mjs — reference sheets shown in the admin MN guide\nexport const SAMPLES: Record<string, { label: string; desc: string; src: string }> = {\n'
for (const [k, label, f, desc] of list) out += `  ${k}: { label: ${JSON.stringify(label)}, desc: ${JSON.stringify(desc)}, src: ${JSON.stringify(readFileSync(`docs/mn/${f}`, 'utf8'))} },\n`
writeFileSync('src/lib/mn/samples.ts', out + '}\n')
console.log('samples.ts written')
