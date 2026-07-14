import type { Worker, LocationPage } from '../types'

export function generateWorkerStructuredData(worker: Worker): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: worker.displayName,
    jobTitle: worker.skills[0] || 'Domestic Worker',
    worksFor: {
      '@type': 'Organization',
      name: 'Traamand Employment Services',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: worker.availability.preferredLocations[0] || 'Harare',
      addressCountry: 'ZW',
    },
    ...(worker.rating > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: worker.rating.toFixed(1),
            reviewCount: worker.reviewCount,
          },
        }
      : {}),
    description: worker.bio,
    image: worker.photos[0] || undefined,
    ...(worker.recentReviews.length > 0
      ? {
          review: worker.recentReviews.slice(0, 3).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author },
            reviewBody: r.text,
            reviewRating: { '@type': 'Rating', ratingValue: r.rating },
            datePublished: r.date?.toDate?.()?.toISOString() || '',
          })),
        }
      : {}),
  }
}

export function generateLocationPageStructuredData(page: LocationPage): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'EmploymentAgency',
    name: `Traamand - ${page.h1}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: page.suburb,
      addressRegion: page.city,
      addressCountry: 'ZW',
    },
    areaServed: `${page.suburb}, ${page.city}`,
    serviceType: 'Domestic Worker Placement',
    ...(page.averageRating > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: page.averageRating.toFixed(1),
            reviewCount: page.recentHires,
          },
        }
      : {}),
  }
}

export function generateCategoryStructuredData(
  category: string,
  city: string,
  workerCount: number
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category} in ${city} | Traamand`,
    description: `Hire verified ${category.toLowerCase()}s in ${city}, Zimbabwe. ${workerCount} available workers with background checks.`,
    numberOfItems: workerCount,
    itemListElement: [],
  }
}

export function generateOrganizationStructuredData(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://traamand.co.zw/#organization',
    name: 'Traamand Employment Services',
    alternateName: ['Traamand', 'Traamand Zimbabwe', 'Traamand Harare'],
    description:
      'Trusted employment agency in Harare, Zimbabwe for verified maids, nannies, chefs, gardeners, nurse aides, drivers, sales ladies, bar ladies, and domestic worker jobs.',
    telephone: '+263 715 325 922',
    email: 'tmandovha@gmail.com',
    image: 'https://traamand.co.zw/logo.png',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Corner Jaison Mbuya Nehanda Street & Central Avenue, Azhari Building, Room 4A',
      addressLocality: 'Harare',
      addressRegion: 'Harare',
      addressCountry: 'ZW',
    },
    areaServed: [
      'Harare',
      'Borrowdale',
      'Avondale',
      'Mt Pleasant',
      'Greendale',
      'Highlands',
      'Mabelreign',
      'Hatfield',
      'Zimbabwe',
    ],
    knowsAbout: [
      'maids in Harare',
      'domestic workers in Harare',
      'nannies in Harare',
      'housekeepers in Harare',
      'domestic worker jobs in Zimbabwe',
      'maid jobs in Harare',
      'nanny jobs in Harare',
    ],
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
    url: 'https://traamand.co.zw',
    sameAs: [],
  }
}

export function generateHiringWebsiteStructuredData(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://traamand.co.zw/#website',
    name: 'Traamand',
    url: 'https://traamand.co.zw',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://traamand.co.zw/hire/{search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateJobsPageStructuredData(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://traamand.co.zw/join-our-team#webpage',
    name: 'Domestic Worker Jobs in Harare and Zimbabwe | Traamand',
    description:
      'Apply for maid, nanny, chef, gardener, nurse aide, driver, sales lady, and bar lady jobs through Traamand Employment Services in Harare, Zimbabwe.',
    url: 'https://traamand.co.zw/join-our-team',
    isPartOf: {
      '@id': 'https://traamand.co.zw/#website',
    },
    publisher: {
      '@id': 'https://traamand.co.zw/#organization',
    },
  }
}
