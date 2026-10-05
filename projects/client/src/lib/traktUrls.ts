const v3 = 'https://app.trakt.tv';

/** Links that leave og: v3 web pages og doesn't clone, plus app stores, community and status. Open them in a new tab. */
export const traktUrls = {
  vip: `${v3}/vip`,
  settings: `${v3}/settings`,
  about: `${v3}/about`,
  terms: `${v3}/terms`,
  privacy: `${v3}/privacy`,
  branding: `${v3}/branding`,
  developer: 'https://developer.trakt.tv',
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
