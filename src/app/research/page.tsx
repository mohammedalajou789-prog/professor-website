'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useLang } from '@/context/LangContext'
import { Search, Filter, ExternalLink, BookOpen, ChevronDown, ChevronUp, Award } from 'lucide-react'

interface Publication {
  id: string; title_en: string
  authors: string; journal_name: string | null; year: number
  volume: string | null; issue: string | null; pages: string | null
  abstract_en: string | null; doi: string | null
  scholar_url: string | null; journal_url: string | null
  citation_count: number; pub_type: string; is_featured: boolean
}

export default function ResearchPage() {
  // نقرأ lang فقط لتمريره للـ Footer — الصفحة نفسها ثابتة إنجليزية
  const { lang } = useLang()
  const [publications, setPublications] = useState<Publication[]>([])
  const [filtered, setFiltered] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data } = await supabase.from('publications').select('*').order('year', { ascending: false })
      if (data) { setPublications(data); setFiltered(data) }
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let result = [...publications]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.title_en.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        (p.journal_name && p.journal_name.toLowerCase().includes(q))
      )
    }
    if (selectedYear !== 'all') result = result.filter(p => p.year === parseInt(selectedYear))
    setFiltered(result)
  }, [search, selectedYear, publications])

  const years = [...new Set(publications.map(p => p.year))].sort((a, b) => b - a)

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
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">Research Library</p>
          <h1 className="text-white text-2xl md:text-3xl font-bold mb-6 font-display">Research</h1>
          <div className="relative max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, author, journal..."
              className="w-full bg-white/10 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#C9A84C]" />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="flex items-center gap-1.5 text-gray-500 text-sm"><Filter size={14} /><span>Filter:</span></div>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-[#C9A84C] cursor-pointer">
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-gray-400 text-xs ml-auto">{filtered.length} results</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No publications found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((pub, i) => {
              const isExpanded = expandedId === pub.id
              return (
                <div key={pub.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#C9A84C]/30 hover:shadow-sm transition-all">
                  <div className="p-5">
                    <div className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-[#1B2A4A]/8 flex items-center justify-center text-[#1B2A4A] text-xs font-semibold mt-0.5">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[#1B2A4A] font-semibold text-sm leading-snug mb-1.5">
                          {pub.title_en}
                          {pub.is_featured && <span className="ml-2 px-1.5 py-0.5 bg-[#C9A84C]/15 text-[#C9A84C] text-xs rounded">★</span>}
                        </h3>
                        <p className="text-gray-500 text-xs mb-2">{pub.authors}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          {pub.journal_name && <span className="text-[#C9A84C] text-xs italic">{pub.journal_name}</span>}
                          <span className="text-gray-400 text-xs font-medium">{pub.year}</span>
                          {pub.volume && <span className="text-gray-400 text-xs">Vol. {pub.volume}{pub.issue ? `(${pub.issue})` : ''}</span>}
                          {pub.pages && <span className="text-gray-400 text-xs">pp. {pub.pages}</span>}
                          {pub.citation_count > 0 && <span className="flex items-center gap-1 text-gray-400 text-xs"><Award size={11} />{pub.citation_count} citations</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {pub.doi && <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-2 py-1 rounded transition-colors"><ExternalLink size={10} /> DOI</a>}
                          {pub.scholar_url && <a href={pub.scholar_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-400 px-2 py-1 rounded transition-colors"><ExternalLink size={10} /> Scholar</a>}
                          {pub.journal_url && <a href={pub.journal_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-2 py-1 rounded transition-colors"><ExternalLink size={10} /> Journal</a>}
                        </div>
                      </div>
                    </div>
                    {pub.abstract_en && (
                      <button onClick={() => setExpandedId(isExpanded ? null : pub.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1B2A4A] mt-3 ml-12 transition-colors">
                        {isExpanded ? <><ChevronUp size={13} /> Hide details</> : <><ChevronDown size={13} /> Show abstract</>}
                      </button>
                    )}
                  </div>
                  {isExpanded && pub.abstract_en && (
                    <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                      <h4 className="text-[#1B2A4A] font-medium text-xs uppercase tracking-wider mb-2">Abstract</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{pub.abstract_en}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  )
}
