import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title: string
  description: string
  canonical?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
  structuredData?: Record<string, unknown>
  noIndex?: boolean
}

export default function SEOHead({
  title,
  description,
  canonical,
  ogImage = 'https://traamand.co.zw/logo.png',
  ogType = 'website',
  structuredData,
  noIndex,
}: SEOProps) {
  const fullTitle = title.includes('Traamand') ? title : `${title} | Traamand`
  const siteUrl = 'https://traamand.co.zw'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical || siteUrl} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {canonical && <link rel="canonical" href={canonical} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {structuredData && (
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      )}
    </Helmet>
  )
}

export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const listItems = items.map((item, i) => ({
    '@type': 'ListItem' as const,
    position: i + 1,
    name: item.name,
    item: `https://traamand.co.zw${item.url}`,
  }))

  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: listItems,
  }

  return <script type="application/ld+json">{JSON.stringify(data)}</script>
}
