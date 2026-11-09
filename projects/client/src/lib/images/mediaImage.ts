type MediaType = 'movie' | 'show' | 'season' | 'episode' | 'person' | 'network' | 'company' | 'list';
type MediaSlot = 'poster' | 'fanart' | 'logo' | 'clearart' | 'banner' | 'thumb' | 'screenshot' | 'headshot';

const FOLDERS: Readonly<Record<MediaType, string>> = {
  movie: 'movies',
  show: 'shows',
  season: 'seasons',
  episode: 'episodes',
  person: 'people',
  network: 'networks',
  company: 'companies',
  list: 'lists',
};

// Art drawn as words or a strip comes in medium and full only.
const NO_THUMB: ReadonlySet<MediaSlot> = new Set(['logo', 'clearart', 'banner']);

interface MediaImageParams {
  readonly type: MediaType;
  readonly id: number;
  readonly slot: MediaSlot;
  readonly size: 'thumb' | 'medium' | 'full';
  /** Art to try when this one is missing, like the show's poster for a season's (`brokenImageFallback`). */
  readonly fallback?: string;
}

/**
 * A Trakt image's URL, built from the item's Trakt id: media.trakt.tv keeps every image at
 * `{type}/{id}/{size}/{slot}.webp`. The URL doesn't say whether the art exists. A missing one is a 404 that keeps its
 * placeholder, or tries `fallback` first, which rides in the URL's fragment. A thumb logo, clearart or banner is the
 * medium one, the smallest made.
 */
export function mediaImage({ type, id, slot, size, fallback }: MediaImageParams): string {
  const folder = size === 'thumb' && NO_THUMB.has(slot) ? 'medium' : size;
  const url = `https://media.trakt.tv/${FOLDERS[type]}/${id}/${folder}/${slot}.webp`;
  return fallback ? `${url}#fallback=${encodeURIComponent(fallback)}` : url;
}
