/** Shown instantly while a lecture (or another tab of it) loads. */
export default function LoadingLecture() {
  return (
    <div className="paper min-h-screen">
      <div className="sticky top-16 z-30 h-[92px] border-b border-line bg-surface" />
      <div className="px-0 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-[980px] overflow-hidden rounded-lg bg-surface p-6 shadow-[var(--c-shadow)] sm:p-12">
          <div className="mb-6 h-3 w-1/2 animate-pulse rounded bg-surface-3" />
          <div className="mb-6 h-24 animate-pulse rounded-xl bg-[#0B6FA4]/25" />
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="mb-3 h-3 animate-pulse rounded bg-surface-3" style={{ width: `${92 - ((i * 13) % 35)}%`, animationDelay: `${i * 80}ms` }} />
          ))}
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-surface-2" />
        </div>
      </div>
    </div>
  )
}
