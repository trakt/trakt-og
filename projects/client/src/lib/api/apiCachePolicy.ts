const MINUTE = 60;
// Charts, search and feeds move through the day, and the API itself keeps trending for 10 minutes.
const CHART_SECONDS = 5 * MINUTE;
// A title's, season's, episode's or person's details, credits, ratings, stats and where to watch change slowly.
const CATALOG_SECONDS = 15 * MINUTE;
// Genres, networks, countries, languages, certifications and streaming sources change a few times a year.
const REFERENCE_SECONDS = 24 * 60 * MINUTE;
// Members' profiles, lists and comments: what one member writes, which they expect to see at once.
const AUTHORED_SECONDS = 5 * MINUTE;

export type ApiCachePolicy = {
  /** The most this read is kept; the API's own `max-age` can shorten it. */
  seconds: number;
  /**
   * Only served from the cache to a visitor without a session. A member who just changed their own profile, list or
   * comment would see the old one, so a signed-in read always goes to the API, and refreshes the copy.
   */
  signedOutOnly: boolean;
};

const chart: ApiCachePolicy = { seconds: CHART_SECONDS, signedOutOnly: false };
const catalog: ApiCachePolicy = { seconds: CATALOG_SECONDS, signedOutOnly: false };
const reference: ApiCachePolicy = { seconds: REFERENCE_SECONDS, signedOutOnly: false };
const authored: ApiCachePolicy = { seconds: AUTHORED_SECONDS, signedOutOnly: true };

const CHARTS = new Set([
  'anticipated',
  'boxoffice',
  'collected',
  'favorited',
  'played',
  'popular',
  'recommended',
  'streaming',
  'trending',
  'updates',
  'watched',
]);
const REFERENCES = new Set(['certifications', 'countries', 'genres', 'languages', 'networks']);
const CATALOGS = new Set(['movies', 'shows', 'people']);
// Under a title or person, the parts members write.
const AUTHORED = new Set(['comments', 'lists', 'notes']);

/** A title's or person's read: a chart, their comments or lists, who is watching right now, or catalog data. */
function catalogPolicy(root: string, second: string | undefined, rest: readonly string[]): ApiCachePolicy | null {
  if (root !== 'people' && second && CHARTS.has(second)) return chart;
  if (rest.includes('watching')) return null;
  if (rest.some((segment) => AUTHORED.has(segment))) return authored;
  return catalog;
}

/**
 * How long the data center may keep an API read made without a token, by kind of data, or null when it must always
 * go to the API. Only public catalog and community reads have one: anything else (`/sync`, `/recommendations`, every
 * `/v3` route, who is watching right now) is never kept, so a route added later is uncached until it's listed here.
 */
export function apiCachePolicy(pathname: string): ApiCachePolicy | null {
  const [root = '', second, ...rest] = pathname.split('/').filter(Boolean);

  if (CATALOGS.has(root)) return catalogPolicy(root, second, rest);
  if (REFERENCES.has(root)) return reference;
  if (root === 'watchnow' && second === 'sources') return reference;
  if (root === 'search') return chart;
  if (root === 'calendars' && (second === 'all' || second === 'releases')) return catalog;
  if (root === 'comments') return second === 'trending' ? chart : authored;
  if (root === 'lists') return second === 'trending' || second === 'popular' ? chart : authored;
  if (root === 'users') return second === 'me' || rest.includes('watching') ? null : authored;
  return null;
}
