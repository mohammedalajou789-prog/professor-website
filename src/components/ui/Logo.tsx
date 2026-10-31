/** Site mark: a fractional integral ∫^α (the professor's field) — also the favicon. */
export default function Logo({ className = '' }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.svg" alt="" width={40} height={40} className={className} decoding="async" />
}
