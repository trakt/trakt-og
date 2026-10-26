import { z } from 'zod/v4';

export type SearchView = 'grid' | 'list';
export type SearchArtwork = 'poster' | 'fanart' | 'logo' | 'none';

/** How the results show: the sidebar's Display section. */
export type SearchDisplay = {
  readonly view: SearchView;
  readonly artwork: SearchArtwork;
};

/** The cookies the Display section writes, a year each, shared by every search tab. */
export const SEARCH_DISPLAY_COOKIES = {
  view: 'search_view',
  artwork: 'search_artwork',
} as const;

/** The artwork the Display section offers, in its order. */
export const SEARCH_ARTWORK = ['poster', 'fanart', 'logo', 'none'] as const satisfies readonly SearchArtwork[];

// OG's profile "Search image type", which the API sends as null to a member who isn't VIP or grandfathered. Its thumb
// and screenshot are wide art, so they start on fanart; a banner starts on posters.
const PROFILE_ARTWORK: Readonly<Record<string, SearchArtwork>> = {
  poster: 'poster',
  thumb: 'fanart',
  screenshot: 'fanart',
  fanart: 'fanart',
  logo: 'logo',
  banner: 'poster',
};
const settingsSchema = z.object({
  browsing: z.object({ search: z.object({ image_type: z.string().nullish() }).nullish() }).nullish(),
});

type SearchDisplayParams = {
  cookies: { readonly get: (name: string) => string | undefined };
  /** The layout's `/users/settings`, null when signed out. */
  settings: unknown;
};

const isView = (value: string | undefined): value is SearchView => value === 'grid' || value === 'list';
const isArtwork = (value: string | undefined): value is SearchArtwork =>
  SEARCH_ARTWORK.some((artwork) => artwork === value);

/** The viewer's display choices from their cookies, the grid and their profile's search image type by default. */
export function searchDisplay({ cookies, settings }: SearchDisplayParams): SearchDisplay {
  const view = cookies.get(SEARCH_DISPLAY_COOKIES.view);
  const artwork = cookies.get(SEARCH_DISPLAY_COOKIES.artwork);
  const parsed = settingsSchema.safeParse(settings);
  const profile = parsed.success ? parsed.data.browsing?.search?.image_type : undefined;
  return {
    view: isView(view) ? view : 'grid',
    artwork: isArtwork(artwork) ? artwork : (PROFILE_ARTWORK[profile ?? ''] ?? 'poster'),
  };
}
