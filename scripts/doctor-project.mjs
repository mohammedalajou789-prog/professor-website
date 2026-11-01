// Rebuilds the Claude-project package for the professor: docs/doctor-project/
//   node scripts/doctor-project.mjs
// INSTRUCTIONS.md is written by hand; everything else is copied from docs/ so it never goes stale.
import { copyFileSync, mkdirSync } from 'node:fs'
const out = 'docs/doctor-project'
mkdirSync(out, { recursive: true })
const files = [
  ['docs/MN_SYNTAX_SPEC.md', 'MN_SYNTAX_SPEC.md'],
  ['docs/DOCTOR_GUIDE.md', 'DOCTOR_GUIDE.md'],
  // examples as .txt: Claude project knowledge accepts .txt everywhere (.mn may be rejected)
  ['docs/mn/complete-sheet.mn', 'EXAMPLE-complete-sheet.txt'],
  ['docs/mn/lecture-01.mn', 'EXAMPLE-lecture-01.txt'],
  ['docs/mn/python-figures.mn', 'EXAMPLE-python-figures.txt'],
  ['docs/mn/showcase.mn', 'EXAMPLE-builtin-figures.txt'],
  ['docs/mn/arabic-sample.mn', 'EXAMPLE-arabic-sheet.txt'],
  ['docs/mn/bilingual-sample.mn', 'EXAMPLE-bilingual-sheet.txt'],
  ['docs/mn/lecture-04.mn', 'EXAMPLE-lecture-04.txt'],
]
for (const [from, to] of files) copyFileSync(from, `${out}/${to}`)
console.log('doctor-project:', files.length + 1, 'files')
