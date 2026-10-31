import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://ahmadelajou.com'
  return ['', '/about', '/research', '/publications', '/courses', '/contact'].map((p) => ({ url: base + p, changeFrequency: 'weekly', priority: p ? 0.7 : 1 }))
}
