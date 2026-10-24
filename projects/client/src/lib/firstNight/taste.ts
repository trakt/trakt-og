import { rawApiFetch } from '../api/rawApiFetch.ts';

/** A streaming service as the taste picker's tile shows it. */
export type TasteService = {
  readonly slug: string;
  readonly name: string;
  readonly color: string;
  readonly logo?: string;
  /** The sub-brand badge under the logo: "on Amazon", "on Apple TV", "free", "with Ads". */
  readonly channel?: string;
};

type SourceRow = {
  source: string;
  name: string;
  color?: string | null;
  cinema?: boolean;
  link_count?: number;
  images?: { logo?: string | null; channel?: string | null } | null;
};

/** Three rows of the popup's six, until the member searches. */
export const SERVICES_SHOWN = 18;

const https = (url: string) => (url.startsWith('http') ? url : `https://${url}`);

// Cinemas sell tickets, not streams.
const isService = ({ cinema }: SourceRow) => !cinema;

/**
 * The big subscription services, most popular first, each only where the country has it. The API has no popularity or
 * store-or-subscription flag, and its link counts rank rental stores first, so this order leads and link counts follow.
 */
const POPULAR = [
  'netflix',
  'amazon_prime_video',
  'disney_plus',
  'hbo_max',
  'hulu',
  'apple_tv_plus',
  'paramount_plus',
  'paramount_plus_premium',
  'peacock',
  'crunchyroll',
  'youtube_premium',
  'now_tv',
  'sky_go',
  'bbc_iplayer',
  'itvx',
  'crave',
  'stan',
  'binge',
  'canal_plus',
  'globoplay',
  'rtl_plus',
  'joyn',
  'wow',
  'skyshowtime',
  'viaplay',
  'zee5',
  'starz',
  'mgm_plus',
  'amc_plus',
  'britbox',
  'mubi',
  'tubi_tv',
  'pluto_tv',
  'plex',
];

/** Rental and purchase stores: offered, but after every service. */
const STORES = new Set([
  'amazon_video',
  'apple_tv',
  'google_play_movies',
  'fandango_at_home',
  'youtube',
  'microsoft_store',
]);

// Popular services, then other services, then channels and ad tiers sold through another one, then stores.
const rank = ({ source, link_count, images }: SourceRow) => {
  const popular = POPULAR.indexOf(source);
  if (popular >= 0) return [0, popular];
  if (STORES.has(source)) return [3, -(link_count ?? 0)];
  return [images?.channel ? 2 : 1, -(link_count ?? 0)];
};

const byRank = (a: SourceRow, b: SourceRow) => {
  const [groupA = 0, orderA = 0] = rank(a);
  const [groupB = 0, orderB = 0] = rank(b);
  return groupA - groupB || orderA - orderB;
};

/** Every streaming service in the country, popular subscriptions first. Read without a token. */
export async function fetchTasteServices(fetch: typeof globalThis.fetch, country: string): Promise<TasteService[]> {
  try {
    const response = await rawApiFetch({ fetch, path: `/watchnow/sources/${country}` });
    if (!response.ok) return [];
    const body: Record<string, SourceRow[]>[] = await response.json();
    return body
      .flatMap((byCountry) => byCountry[country] ?? [])
      .filter(isService)
      .toSorted(byRank)
      .map(({ source, name, color, images }) => ({
        slug: source,
        name: name.trim(),
        color: color ?? '#000',
        ...(images?.logo && { logo: https(images.logo) }),
        ...(images?.channel && { channel: https(images.channel) }),
      }));
  } catch {
    return [];
  }
}

/** A watch-now country for the picker: its code, name and flag. */
export type TasteCountry = { readonly code: string; readonly name: string; readonly flag?: string };

/** Every watch-now country, by name. A failure leaves the picker on the member's own country alone. */
export async function fetchTasteCountries(fetch: typeof globalThis.fetch): Promise<TasteCountry[]> {
  try {
    const response = await rawApiFetch({ fetch, path: '/watchnow/countries' });
    if (!response.ok) return [];
    const rows: { code: string; name: string; images?: { flag?: string | null } | null }[] = await response.json();
    return rows
      .map(({ code, name, images }) => ({
        code: code.toLowerCase(),
        name,
        ...(images?.flag && { flag: https(images.flag) }),
      }))
      .toSorted((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/** v3's genre picker's genres, with OG's solid icons. Slugs are the API's genre slugs. */
export const tasteGenres = [
  { slug: 'action', name: 'Action', icon: 'bolt' },
  { slug: 'adventure', name: 'Adventure', icon: 'compass' },
  { slug: 'animation', name: 'Animation', icon: 'palette' },
  { slug: 'anime', name: 'Anime', icon: 'dragon' },
  { slug: 'biography', name: 'Biography', icon: 'book-open-reader' },
  { slug: 'children', name: 'Children', icon: 'child' },
  { slug: 'comedy', name: 'Comedy', icon: 'face-laugh-squint' },
  { slug: 'crime', name: 'Crime', icon: 'gun' },
  { slug: 'documentary', name: 'Documentary', icon: 'video' },
  { slug: 'drama', name: 'Drama', icon: 'masks-theater' },
  { slug: 'family', name: 'Family', icon: 'people-roof' },
  { slug: 'fantasy', name: 'Fantasy', icon: 'hat-wizard' },
  { slug: 'history', name: 'History', icon: 'landmark' },
  { slug: 'holiday', name: 'Holiday', icon: 'gift' },
  { slug: 'horror', name: 'Horror', icon: 'skull' },
  { slug: 'musical', name: 'Musical', icon: 'music' },
  { slug: 'mystery', name: 'Mystery', icon: 'magnifying-glass' },
  { slug: 'romance', name: 'Romance', icon: 'heart' },
  { slug: 'science-fiction', name: 'Science Fiction', icon: 'rocket' },
  { slug: 'superhero', name: 'Superhero', icon: 'mask' },
  { slug: 'suspense', name: 'Suspense', icon: 'user-secret' },
  { slug: 'thriller', name: 'Thriller', icon: 'stopwatch' },
  { slug: 'war', name: 'War', icon: 'person-rifle' },
  { slug: 'western', name: 'Western', icon: 'hat-cowboy' },
] as const;

/** v3 keeps a member to five favorite genres. */
export const GENRE_LIMIT = 5;

/** ...and five favorite streaming services. */
export const SERVICE_LIMIT = 5;

/** `us-netflix`: how settings key a favorite service, by country. */
export const serviceKey = (country: string, slug: string) => `${country}-${slug}`;
