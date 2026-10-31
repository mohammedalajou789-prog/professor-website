'use client'

import { useState } from 'react'

/** Step-by-step reveal of a solution (">>>" separators in MN). */
export default function StepsBlock({ steps, ar = false }: { steps: React.ReactNode[]; ar?: boolean }) {
  const [n, setN] = useState(1)
  const all = n >= steps.length
  return (
    <div>
      {steps.slice(0, n).map((s, k) => (
        <div key={k} className="mn-step">
          {steps.length > 1 && <span className="mn-step-idx">{ar ? 'الخطوة' : 'Step'} {k + 1}</span>}
          {s}
        </div>
      ))}
      {steps.length > 1 && (
        <div className="mn-steps-ctl">
          {!all && <button type="button" onClick={() => setN(n + 1)}>{ar ? 'الخطوة التالية ◂' : 'Next step ▸'}</button>}
          {!all && <button type="button" onClick={() => setN(steps.length)}>{ar ? 'عرض الكل' : 'Show all'}</button>}
          {all && <button type="button" onClick={() => setN(1)}>{ar ? '↺ إعادة' : '↺ Replay'}</button>}
        </div>
      )}
    </div>
  )
}
