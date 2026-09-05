'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useLang } from '@/context/LangContext'
import { Mail, Phone, MapPin, Clock, ExternalLink, Send } from 'lucide-react'

export default function ContactPage() {
  const { lang, isRTL } = useLang()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data } = await supabase.from('profile').select('*').single()
      if (data) setProfile(data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const t = {
    en: {
      title: 'Contact', subtitle: 'Get in Touch', info: 'Contact Information',
      email: 'Email', phone: 'Phone', office: 'Office', hours: 'Office Hours',
      profiles: 'Academic Profiles', formTitle: 'Send a Message',
      name: 'Your Name', emailField: 'Your Email', subject: 'Subject', message: 'Message',
      send: 'Send Message', sending: 'Sending...', successTitle: 'Message Sent!',
      successMsg: 'Thank you for reaching out. I will get back to you soon.',
      note: 'Note: This form opens your email client.',
    },
    ar: {
      title: 'تواصل', subtitle: 'تواصل معي', info: 'معلومات التواصل',
      email: 'البريد الإلكتروني', phone: 'الهاتف', office: 'مكتب', hours: 'ساعات المكتب',
      profiles: 'الملفات الأكاديمية', formTitle: 'أرسل رسالة',
      name: 'اسمك', emailField: 'بريدك الإلكتروني', subject: 'الموضوع', message: 'الرسالة',
      send: 'إرسال', sending: 'جاري الإرسال...', successTitle: 'تم الإرسال!',
      successMsg: 'شكراً لتواصلك. سأرد عليك في أقرب وقت.',
      note: 'ملاحظة: سيفتح هذا النموذج تطبيق البريد الإلكتروني.',
    },
  }[lang]

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    const mailto = `mailto:${profile?.email || 'ajou44@bau.edu.jo'}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`
    window.location.href = mailto
    setTimeout(() => { setSent(true); setSending(false) }, 1000)
  }

  const academicLinks = [
    { label: 'Google Scholar', url: profile?.google_scholar_url, color: 'text-blue-600' },
    { label: 'ORCID', url: profile?.orcid_url, color: 'text-green-600' },
    { label: 'ResearchGate', url: profile?.researchgate_url, color: 'text-teal-600' },
    { label: 'LinkedIn', url: profile?.linkedin_url, color: 'text-blue-700' },
  ].filter(l => l.url)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4]">
      <div className="w-10 h-10 border-4 border-[#1B2A4A] border-t-[#C9A84C] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className={`min-h-screen bg-[#F8F7F4] ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />

      <div className="bg-[#1B2A4A] pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#C9A84C] text-xs tracking-widest uppercase mb-2">{t.subtitle}</p>
          <h1 className={`text-white text-2xl md:text-3xl font-bold ${isRTL ? 'font-arabic' : 'font-display'}`}>{t.title}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="md:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className={`text-[#1B2A4A] font-semibold text-sm mb-4 gold-underline ${isRTL ? 'font-arabic text-right' : 'font-display'}`}>{t.info}</h2>
              <div className="space-y-4 mt-6">
                {profile?.email && (
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#1B2A4A]/8 flex items-center justify-center shrink-0"><Mail size={14} className="text-[#1B2A4A]" /></div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className={`text-gray-400 text-xs mb-0.5 ${isRTL ? 'font-arabic' : ''}`}>{t.email}</p>
                      <a href={`mailto:${profile.email}`} className="text-[#1B2A4A] text-sm hover:text-[#C9A84C] transition-colors break-all">{profile.email}</a>
                    </div>
                  </div>
                )}
                {profile?.phone && (
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#1B2A4A]/8 flex items-center justify-center shrink-0"><Phone size={14} className="text-[#1B2A4A]" /></div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className={`text-gray-400 text-xs mb-0.5 ${isRTL ? 'font-arabic' : ''}`}>{t.phone}</p>
                      <p className="text-[#1B2A4A] text-sm">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile?.office && (
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#1B2A4A]/8 flex items-center justify-center shrink-0"><MapPin size={14} className="text-[#1B2A4A]" /></div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className={`text-gray-400 text-xs mb-0.5 ${isRTL ? 'font-arabic' : ''}`}>{t.office}</p>
                      <p className={`text-[#1B2A4A] text-sm ${isRTL ? 'font-arabic' : ''}`}>{profile.office}</p>
                    </div>
                  </div>
                )}
                {profile?.office_hours && (
                  <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-[#1B2A4A]/8 flex items-center justify-center shrink-0"><Clock size={14} className="text-[#1B2A4A]" /></div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className={`text-gray-400 text-xs mb-0.5 ${isRTL ? 'font-arabic' : ''}`}>{t.hours}</p>
                      <p className={`text-[#1B2A4A] text-sm ${isRTL ? 'font-arabic' : ''}`}>{profile.office_hours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {academicLinks.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className={`text-[#1B2A4A] font-semibold text-sm mb-4 gold-underline ${isRTL ? 'font-arabic text-right' : 'font-display'}`}>{t.profiles}</h2>
                <div className="space-y-2 mt-6">
                  {academicLinks.map(link => (
                    <a key={link.label} href={link.url!} target="_blank" rel="noopener noreferrer"
                      className={`flex items-center gap-2 text-sm hover:text-[#C9A84C] transition-colors ${link.color} ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <ExternalLink size={13} />{link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className={`text-[#1B2A4A] font-semibold text-sm mb-6 gold-underline ${isRTL ? 'font-arabic text-right' : 'font-display'}`}>{t.formTitle}</h2>
              {sent ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3"><Send size={22} className="text-green-500" /></div>
                  <h3 className={`text-[#1B2A4A] font-semibold mb-1 ${isRTL ? 'font-arabic' : ''}`}>{t.successTitle}</h3>
                  <p className={`text-gray-400 text-sm ${isRTL ? 'font-arabic' : ''}`}>{t.successMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-gray-500 text-xs mb-1.5 ${isRTL ? 'font-arabic text-right' : ''}`}>{t.name} *</label>
                      <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                        className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${isRTL ? 'text-right font-arabic' : ''}`} />
                    </div>
                    <div>
                      <label className={`block text-gray-500 text-xs mb-1.5 ${isRTL ? 'font-arabic text-right' : ''}`}>{t.emailField} *</label>
                      <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${isRTL ? 'text-right' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-gray-500 text-xs mb-1.5 ${isRTL ? 'font-arabic text-right' : ''}`}>{t.subject} *</label>
                    <input required type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                      className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors ${isRTL ? 'text-right font-arabic' : ''}`} />
                  </div>
                  <div>
                    <label className={`block text-gray-500 text-xs mb-1.5 ${isRTL ? 'font-arabic text-right' : ''}`}>{t.message} *</label>
                    <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                      className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#C9A84C] transition-colors resize-none ${isRTL ? 'text-right font-arabic' : ''}`} />
                  </div>
                  <p className={`text-gray-400 text-xs ${isRTL ? 'font-arabic text-right' : ''}`}>{t.note}</p>
                  <button type="submit" disabled={sending}
                    className="flex items-center gap-2 bg-[#1B2A4A] hover:bg-[#243656] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                    <Send size={14} />{sending ? t.sending : t.send}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer lang={lang} />
    </div>
  )
}
