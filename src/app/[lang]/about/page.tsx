import type { Metadata } from 'next'
import AboutView from './AboutView'
import { getAbout, getProfile } from '@/lib/data'

export const metadata: Metadata = { title: 'About' }

export default async function AboutPage() {
  const [profile, about] = await Promise.all([getProfile(), getAbout()])
  return <AboutView profile={profile} {...(about as any)} />
}
