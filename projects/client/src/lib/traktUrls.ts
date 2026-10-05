const v3 = 'https://app.trakt.tv';

/** Links that leave og: v3 web pages og doesn't clone, plus app stores, community and status. Open them in a new tab. */
export const traktUrls = {
  vip: `${v3}/vip`,
  settings: `${v3}/settings`,
  yearInReview: (slug: string, year: number) => `${v3}/users/${encodeURIComponent(slug)}/year/${year}`,
  monthInReview: (slug: string, year: number, month: number) =>
    `${v3}/users/${encodeURIComponent(slug)}/mir/${year}/${month}`,
  about: `${v3}/about`,
  terms: `${v3}/terms`,
  privacy: `${v3}/privacy`,
  branding: `${v3}/branding`,
  web: v3,
  developer: 'https://developer.trakt.tv',
  traktTime: 'https://tvtime.trakt.tv',
  showlyAppStore: 'https://apps.apple.com/us/app/track-shows-movies-showly/id6739016219',
  showlyGooglePlay: 'https://play.google.com/store/apps/details?id=com.michaldrabik.showly2',
  ripppleAppStore: 'https://apps.apple.com/app/id6758765611',
  appStore: 'https://apps.apple.com/us/app/trakt/id1514873602', /* OG's /a/trakt-ios and /a/trakt-tvos */
  googlePlay: 'https://play.google.com/store/apps/details?id=tv.trakt.trakt', /* /a/trakt-android(-tv) */
  forums: 'https://forums.trakt.tv/c/trakt',
  reddit: 'https://www.reddit.com/r/trakt',
  github: 'https://github.com/trakt/og',
  mastodon: 'https://ruby.social/@trakt',
  twitter: 'https://twitter.com/trakt',
  status: 'https://status.trakt.tv',
  help: 'mailto:support@trakt.tv?subject=Trakt%20Support%20Request',
} as const;
