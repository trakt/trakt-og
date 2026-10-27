import type { SeoSample } from './SeoSample.ts';

const INDEX = 'index, follow, max-image-preview:large';
const NOINDEX = 'noindex, follow';
const DAY = 86_400;

const samples: readonly SeoSample[] = [
  {
    row: 'home',
    path: '/',
    robots: 'index',
    title: /Trakt OG Redux/,
    canonical: '/',
    ogType: ['website'],
    image: 'default',
    jsonLd: ['WebSite', 'Organization'],
  },
  {
    row: 'movie',
    path: '/movies/inception-2010',
    missing: '/movies/og-seo-check-missing-2010',
    robots: 'index',
    title: 'Inception (2010)',
    canonical: '/movies/inception-2010',
    ogType: ['video.movie'],
    image: 'art',
    jsonLd: ['Movie', 'BreadcrumbList'],
    content: 'Inception',
  },
  {
    row: 'show',
    path: '/shows/severance',
    missing: '/shows/og-seo-check-missing',
    robots: 'index',
    title: 'Severance (2022)',
    canonical: '/shows/severance',
    ogType: ['video.tv_show'],
    image: 'art',
    jsonLd: ['TVSeries', 'BreadcrumbList'],
    content: 'Severance',
  },
  {
    row: 'season',
    path: '/shows/severance/seasons/1',
    missing: '/shows/severance/seasons/99',
    robots: 'index',
    title: 'Severance: Season 1',
    canonical: '/shows/severance/seasons/1',
    ogType: ['video.tv_show', 'website'],
    image: 'art',
    jsonLd: ['TVSeason', 'BreadcrumbList'],
    content: 'Season 1',
  },
  {
    row: 'episode',
    path: '/shows/severance/seasons/1/episodes/2',
    missing: '/shows/severance/seasons/1/episodes/999',
    robots: 'index',
    title: 'Severance S01E02: Half Loop',
    canonical: '/shows/severance/seasons/1/episodes/2',
    ogType: ['video.episode'],
    image: 'art',
    jsonLd: ['TVEpisode', 'BreadcrumbList'],
    content: 'Half Loop',
  },
  {
    row: 'person',
    path: '/people/adam-scott',
    missing: '/people/og-seo-check-missing',
    robots: 'index',
    title: 'Adam Scott',
    canonical: '/people/adam-scott',
    ogType: ['profile', 'website'],
    image: 'art',
    jsonLd: ['Person'],
    content: 'Adam Scott',
  },
  {
    row: 'official list',
    path: '/lists/official/star-wars-collection',
    missing: '/lists/official/og-seo-check-missing',
    robots: 'index',
    title: 'Star Wars Collection',
    canonical: '/lists/official/star-wars-collection',
    ogType: ['website'],
    image: 'art',
    jsonLd: ['ItemList'],
    content: 'Star Wars',
  },
  {
    row: 'personal list',
    path: '/users/justin/lists/imdb-top-rated-movies',
    missing: '/users/justin/lists/og-seo-check-missing',
    robots: 'index',
    title: 'IMDB: Top Rated Movies by Justin',
    canonical: '/users/justin/lists/imdb-top-rated-movies',
    ogType: ['website'],
    image: 'art',
    jsonLd: ['ItemList'],
    content: 'IMDB: Top Rated Movies',
  },
  {
    row: 'profile',
    path: '/users/justin',
    missing: '/users/og-seo-check-missing',
    robots: 'index',
    title: 'Justin (@justin)',
    canonical: '/users/justin',
    ogType: ['profile'],
    image: 'any',
    content: 'Justin',
  },
  {
    row: 'chart',
    path: '/movies/trending',
    robots: 'index',
    canonical: '/movies/trending',
    ogType: ['website'],
    image: 'default',
    content: 'Trending',
  },
  {
    row: 'title comments',
    path: '/movies/inception-2010/comments',
    robots: 'index',
    title: /^Inception.*: Comments - Trakt OG Redux$/,
    canonical: '/movies/inception-2010/comments',
    ogType: ['website', 'video.movie'],
    image: 'art',
    jsonLd: ['BreadcrumbList'],
    content: 'Inception',
  },
  {
    row: 'review comment',
    path: '/comments/76740',
    missing: '/comments/999999999',
    robots: 'index',
    title: /^Comment by Simon Massey on Inception.* - Trakt OG Redux$/,
    canonical: '/comments/76740',
    ogType: ['website', 'article'],
    image: 'art',
    content: 'Simon Massey',
  },
  { row: 'short comment', path: '/comments/1519', robots: 'noindex', content: 'Jenn' },
  { row: 'search', path: '/search?query=inception', robots: 'noindex' },
  { row: 'user history', path: '/users/justin/history', robots: 'noindex' },
];

/**
 * Everything the launch SEO work (#214 to #224) promises, in one place. `bun run seo:check` fails until each part
 * lands. Sample items are long-lived, popular and public; swap one here if it ever goes away.
 */
export const SEO_EXPECTATIONS = {
  origin: 'https://og.trakt.tv',
  siteName: 'Trakt OG Redux',
  titleSuffix: ' - Trakt OG Redux',
  locale: 'en_US',
  twitterCard: 'summary_large_image',
  twitterSite: '@trakt',
  descriptionMaxLength: 160,
  defaultImage: 'https://og.trakt.tv/og-share.jpg',
  artHost: 'media.trakt.tv',
  robots: { index: INDEX, noindex: NOINDEX },
  /** Sitemap URLs with an open og bug, by path: they show as known instead of failing the run. */
  knownIssues: {} as Readonly<Record<string, string>>,
  /** JSON-LD types every indexable page carries. Organization and WebSite are on the home page only. */
  jsonLd: [] as readonly string[],
  userAgents: {
    'googlebot-phone':
      'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/130.0.6723.116 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'googlebot-desktop':
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; ' +
      '+http://www.google.com/bot.html) Chrome/130.0.6723.116 Safari/537.36',
    bingbot:
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; ' +
      '+http://www.bing.com/bingbot.htm) Chrome/130.0.0.0 Safari/537.36',
    slackbot: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    chrome:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/130.0.0.0 Safari/537.36',
  },
  samples,
  /** Paths whose canonical drops tracking parameters or points elsewhere. */
  canonicalVariants: [
    { path: '/movies/inception-2010?utm_source=seo-check&share=1', canonical: '/movies/inception-2010' },
    { path: '/home', canonical: '/' },
  ],
  /** Pages a preview host must send `X-Robots-Tag: noindex` on. */
  previewPaths: ['/', '/movies/inception-2010', '/sitemap.xml'],
  robotsTxt: {
    sitemap: 'https://og.trakt.tv/sitemap.xml',
    disallowed: [
      '/api/logo/x',
      '/_design',
      '/callback',
      '/auth/signin',
      '/logout',
      '/dashboard',
      '/movies/trending?genres=action',
    ],
    allowed: [...samples.map((sample) => sample.path), '/movies/trending?page=2', '/calendars/my/shows'],
    /** Cloudflare's managed block on the trakt.tv zone, above og's own rules. */
    managedBot: 'GPTBot',
    cacheSeconds: DAY,
  },
  sitemaps: {
    index: '/sitemap.xml',
    children: [
      { path: '/sitemap/pages.xml', lastmod: false, maxUrls: 100, includes: ['/', '/about', '/discover'] },
      { path: '/sitemap/movies.xml', lastmod: true, maxUrls: 2_000, includes: [] },
      { path: '/sitemap/shows.xml', lastmod: true, maxUrls: 2_000, includes: [] },
      { path: '/sitemap/lists.xml', lastmod: true, maxUrls: 2_000, includes: [] },
    ],
    /** URLs from each sitemap fetched to confirm they answer 200 and are indexable. */
    probeUrls: 3,
    cacheSeconds: DAY,
  },
} as const;
