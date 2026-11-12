import { toOrganizationJsonLd } from '../jsonLd/toOrganizationJsonLd.ts';
import { toWebSiteJsonLd } from '../jsonLd/toWebSiteJsonLd.ts';
import type { SeoMeta } from '../SeoMeta.ts';

const home = {
  title: 'Classic Trakt, rebuilt for big screens',
  description:
    'Trakt OG Redux: a rebuild of classic Trakt for desktops and tablets. Built on the Trakt API, and open source.',
  // `/home` is the same page, so search engines list it once, at `/`.
  canonicalPath: '/',
  jsonLd: [toOrganizationJsonLd(), toWebSiteJsonLd()],
} satisfies SeoMeta;

/** The heads of the pages whose head needs no data, by route id. */
export const staticSeo = {
  '/': home,
  '/home': home,
  '/about': {
    title: 'About OG Redux',
    description:
      "OG Redux is the next chapter of Trakt OG, a fork of Trakt's v3 web app rebuilt for big screens on the public Trakt API. It's open source: report bugs and request features on GitHub.",
  },
  '/discover': {
    title: 'Discover new TV shows & movies',
    description:
      "This month's picks on Trakt, shelves for every mood, upcoming premieres, trending comments and the lists the Trakt community is liking.",
  },
  '/dashboard': {
    title: 'Dashboard',
    description: 'Your Trakt dashboard: watching statistics, follow requests and what to watch next.',
  },
  '/live': {
    title: 'Trakt Worldwide, live',
    description: 'Where people are watching right now on Trakt, country by country, live.',
    noindex: true,
  },
  '/signin': { title: 'Sign in' },
  '/signout': { title: 'Sign out' },
  '/callback': { title: 'Signing in' },
} as const satisfies Record<string, SeoMeta>;
