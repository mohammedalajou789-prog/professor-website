'use client'

import dynamic from 'next/dynamic'

const Skeleton = () => <div className="mn-fig-box" style={{ height: 260, background: 'linear-gradient(90deg,#F6F9FC 0%,#EEF3F8 50%,#F6F9FC 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.6s linear infinite' }} />

const Plot = dynamic(() => import('./figs/Plot'), { loading: Skeleton, ssr: false })
const Field = dynamic(() => import('./figs/Field'), { loading: Skeleton, ssr: false })
const Plot3D = dynamic(() => import('./figs/Plot3D'), { loading: Skeleton, ssr: false })
const NumberLine = dynamic(() => import('./figs/Planar').then((m) => m.NumberLine), { loading: Skeleton, ssr: false })
const Vectors = dynamic(() => import('./figs/Planar').then((m) => m.Vectors), { loading: Skeleton, ssr: false })
const Geometry = dynamic(() => import('./figs/Planar').then((m) => m.Geometry), { loading: Skeleton, ssr: false })
const Complex = dynamic(() => import('./figs/Planar').then((m) => m.Complex), { loading: Skeleton, ssr: false })
const SignChart = dynamic(() => import('./figs/Charts').then((m) => m.SignChart), { loading: Skeleton, ssr: false })
const Variation = dynamic(() => import('./figs/Charts').then((m) => m.Variation), { loading: Skeleton, ssr: false })
const Stats = dynamic(() => import('./figs/Charts').then((m) => m.Stats), { loading: Skeleton, ssr: false })
const Tree = dynamic(() => import('./figs/Discrete').then((m) => m.Tree), { loading: Skeleton, ssr: false })
const Venn = dynamic(() => import('./figs/Discrete').then((m) => m.Venn), { loading: Skeleton, ssr: false })
const Graph = dynamic(() => import('./figs/Discrete').then((m) => m.Graph), { loading: Skeleton, ssr: false })
const Diagram = dynamic(() => import('./figs/Discrete').then((m) => m.Diagram), { loading: Skeleton, ssr: false })

const MAP: Record<string, React.ComponentType<{ attrs: Record<string, string>; body: string }>> = {
  plot: Plot, field: Field, plot3d: Plot3D, numberline: NumberLine, vectors: Vectors, geometry: Geometry, complex: Complex,
  signchart: SignChart, variation: Variation, stats: Stats, tree: Tree, venn: Venn, graph: Graph, diagram: Diagram,
}

export default function Figure({ kind, attrs, body }: { kind: string; attrs: Record<string, string>; body: string }) {
  const C = MAP[kind]
  if (!C) return null
  return <C attrs={attrs} body={body} />
}
