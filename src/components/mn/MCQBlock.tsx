'use client'

import { useState } from 'react'

type Q = { q: string; options: { html: string; correct: boolean }[]; explain: string }
const LE = 'abcdefgh'
const LA = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح']

/** Doctor: answers highlighted (as in the Solved PDF). Student: interactive self-check (nothing is stored). */
export default function MCQBlock({ questions, mode, lecture, ar = false }: { questions: Q[]; mode: 'student' | 'doctor'; lecture: string; ar?: boolean }) {
  const L = ar ? LA : LE.split('')
  const [picked, setPicked] = useState<Record<number, number>>({})
  const answered = Object.keys(picked).length
  const score = Object.entries(picked).filter(([qi, oi]) => questions[+qi]?.options[oi]?.correct).length

  return (
    <section className="mn-box mn-mcq mn-style-bar reveal">
      <header className="mn-box-title">{ar ? `تقييم ذاتي: أسئلة اختيار من متعدد${lecture ? ` (المحاضرة ${lecture})` : ''}` : `Self-Assessment: Multiple-Choice Questions${lecture ? ` (Lecture ${lecture})` : ''}`}</header>
      <div className="mn-box-body">
        {questions.map((q, qi) => {
          const p = picked[qi]
          const reveal = mode === 'doctor' || p !== undefined
          const correctIdx = q.options.findIndex((o) => o.correct)
          return (
            <div key={qi} className="mn-q">
              <div className="mn-q-head">
                <span className="mn-q-num">{ar ? `س${qi + 1}.` : `Q${qi + 1}.`}</span>
                <span dangerouslySetInnerHTML={{ __html: q.q }} />
              </div>
              <div className="mn-opts">
                {q.options.map((o, oi) => {
                  const cls =
                    mode === 'doctor'
                      ? o.correct ? 'mn-opt-correct' : ''
                      : p === undefined ? '' : o.correct ? 'mn-opt-correct' : p === oi ? 'mn-opt-wrong' : ''
                  const content = (
                    <>
                      <span className="mn-opt-letter">{mode === 'doctor' && o.correct ? <b>({L[oi]})</b> : `(${L[oi]})`}</span>
                      <span dangerouslySetInnerHTML={{ __html: o.html }} />
                    </>
                  )
                  return mode === 'student' ? (
                    <button key={oi} type="button" className={`mn-opt ${cls}`} disabled={p !== undefined} onClick={() => setPicked({ ...picked, [qi]: oi })}>
                      {content}
                    </button>
                  ) : (
                    <div key={oi} className={`mn-opt ${cls}`}>{content}</div>
                  )
                })}
              </div>
              {reveal && (q.explain || mode === 'doctor') && (
                <p className="mn-explain">
                  <strong>{ar ? 'الإجابة' : 'Answer'}: ({L[correctIdx]}).</strong> <span dangerouslySetInnerHTML={{ __html: q.explain }} />
                </p>
              )}
            </div>
          )
        })}
        {mode === 'student' && answered > 0 && (
          <p className="mn-mcq-score">
            {ar ? `${score} / ${answered} صحيحة` : `${score} / ${answered} correct`}
            {answered < questions.length ? (ar ? ` · بقي ${questions.length - answered}` : ` · ${questions.length - answered} left`) : ''}
            <button type="button" onClick={() => setPicked({})} style={{ marginInlineStart: 10, textDecoration: 'underline', background: 'none', border: 0, color: 'inherit', cursor: 'pointer', font: 'inherit' }}>
              {ar ? 'إعادة' : 'reset'}
            </button>
          </p>
        )}
      </div>
    </section>
  )
}
