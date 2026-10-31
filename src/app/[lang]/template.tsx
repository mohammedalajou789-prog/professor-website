/** Re-mounts on every navigation → soft page-enter animation. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
