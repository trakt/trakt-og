import { SITE_ORIGIN } from './siteOrigin.ts';

/** What a page without its own description or art says: the default share image is static/og-share.jpg. */
export const SEO_DEFAULTS = {
  description:
    'Trakt OG Redux: classic Trakt, rebuilt for desktops and tablets. Track the shows and movies you watch, on the Trakt API.',
  image: {
    url: `${SITE_ORIGIN}/og-share.jpg`,
    alt: 'Trakt OG Redux: classic Trakt, rebuilt for big screens.',
    width: 1200,
    height: 630,
  },
} as const;
