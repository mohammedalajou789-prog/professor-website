'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useLang } from '@/context/LangContext'
import { ExternalLink, Award } from 'lucide-react'

interface Publication {
  id: string; title_en: string
  authors: string; journal_name: string | null; year: number
  volume: string | null; issue: string | null; pages: string | null
  doi: string | null; scholar_url: string | null
  pub_type: string; citation_count: number
}

export default function PublicationsPage() {
  // نقرأ lang فقط لتمريره للـ Footer — الصفحة نفسها ثابتة إنجليزية
  const { lang } = useLang()
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data } = await supabase.from('publications').select('*').order('year', { ascending: false })
      if (data) setPublications(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const byYear = publications.reduce((acc, pub) => {
    const y = pub.year.toString()
    if (!acc[y]) acc[y] = []
    acc[y].push(pub)
    return acc
  }, {} as Record<string, Publication[]>)

  const sortedYears = Object.keys(byYear).sort((a, b) => parseInt(b) - parseInt(a))

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
      <div className="w-10 h-10 border-4 border-[#1B2A4A] border-t-[#C9A84C] rounded-full animate-spin" />
    </div>
  )

  // dir="ltr" و lang ثابتان — هذه الصفحة إنجليزية بالكامل بغض النظر عن اللغة المختارة
  return (
    <div className="min-h-screen bg-[#F8F7F4]" dir="ltr" lang="en">
      <Navbar />

      <div className="bg-[#1B2A4A] pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Academic Publications</p>
            <h1 className="text-white text-2xl md:text-3xl font-bold font-display">Publications</h1>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-[#C9A84C] font-display">{publications.length}</p>
            <p className="text-gray-400 text-xs mt-0.5">Total Publications</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {publications.length === 0 ? (
          <div className="text-center py-16"><p className="text-gray-400 text-sm">No publications yet.</p></div>
        ) : (
          <div className="space-y-10">
            {sortedYears.map(year => (
              <div key={year}>
                <div className="flex items-center gap-4 mb-5">
                  <h2 className="text-[#1B2A4A] text-xl font-bold font-display">{year}</h2>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-gray-400 text-xs">{byYear[year].length} papers</span>
                </div>
                <div className="space-y-3">
                  {byYear[year].map((pub, i) => (
                    <div key={pub.id} className="bg-white rounded-lg border border-gray-100 p-5 hover:border-[#C9A84C]/30 hover:shadow-sm transition-all">
                      <div className="flex gap-3">
                        <span className="shrink-0 text-[#C9A84C] font-semibold text-sm font-display mt-0.5">[{i + 1}]</span>
                        <div className="flex-1">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            <span className="text-gray-500">{pub.authors}. </span>
                            <span className="text-[#1B2A4A] font-medium">{pub.title_en}. </span>
                            {pub.journal_name && <span className="italic text-[#C9A84C]">{pub.journal_name}. </span>}
                            <span className="text-gray-500">{pub.year}</span>
                            {pub.volume && <span className="text-gray-500">; {pub.volume}</span>}
                            {pub.issue && <span className="text-gray-500">({pub.issue})</span>}
                            {pub.pages && <span className="text-gray-500">: {pub.pages}</span>}
                            <span className="text-gray-400">.</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {pub.citation_count > 0 && <span className="flex items-center gap-1 text-gray-400 text-xs"><Award size={11} />{pub.citation_count} cited</span>}
                            <div className="flex gap-1.5 ml-auto">
                              {pub.doi && <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-100 hover:border-blue-300 px-2 py-0.5 rounded transition-colors"><ExternalLink size={9} /> DOI</a>}
                              {pub.scholar_url && <a href={pub.scholar_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 border border-purple-100 hover:border-purple-300 px-2 py-0.5 rounded transition-colors"><ExternalLink size={9} /> Scholar</a>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  )
}
