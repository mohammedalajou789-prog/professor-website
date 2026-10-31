import HomeView from './HomeView'
import { getInterests, getNews, getProfile, getPublications } from '@/lib/data'

export default async function HomePage() {
  const [profile, pubs, news, interests] = await Promise.all([getProfile(), getPublications(), getNews(), getInterests()])
  const featured = pubs.filter((p: any) => p.is_featured)
  const shown = (featured.length >= 4 ? featured : [...featured, ...pubs.filter((p: any) => !p.is_featured)]).slice(0, 4)
  const totalCitations = pubs.reduce((s: number, p: any) => s + (p.citation_count ?? 0), 0)
  return (
    <HomeView
      profile={profile as any}
      publications={shown}
      allPubCount={pubs.length}
      totalCitations={totalCitations}
      news={news as any}
      interests={interests}
    />
  )
}
