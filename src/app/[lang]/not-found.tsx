import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="hero-backdrop relative flex min-h-[70vh] items-center justify-center overflow-hidden px-6 text-center">
      <div className="hero-grid absolute inset-0" />
      <div className="relative">
        <p className="font-display text-[clamp(64px,14vw,140px)] italic leading-none text-[#C9A227]">∄</p>
        <h1 className="mt-4 font-display text-3xl text-white">This page does not exist</h1>
        <p className="mt-2 text-[#AEBBCC]">∄ x ∈ Site : path(x) = this URL</p>
        <Link href="/" className="mt-8 inline-block rounded-md bg-[#C9A227] px-6 py-3 font-semibold text-[#0A1A30]">Home</Link>
      </div>
    </section>
  )
}
