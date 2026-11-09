import { mediaImage } from '../../images/mediaImage.ts';
import type { HomeMediaType } from './toHomeLive.ts';

/** A trending row as `/{type}/trending` returns it, with the show or movie under its type's key. */
export type HomeTrendingRow = {
  readonly watchers: number;
  readonly item: {
    readonly title: string;
    readonly year?: number | null;
    readonly ids: { readonly trakt: number; readonly slug: string };
  };
};

export type HomeTrendingTitle = {
  readonly key: string;
  readonly type: HomeMediaType;
  readonly slug: string;
  readonly title: string;
  readonly year?: number;
  readonly href: string;
  readonly poster?: string;
};

/** Trending rows as the home page's posters, and the titles whose watchers fill the map. */
export function toHomeTrending(type: HomeMediaType, rows: readonly HomeTrendingRow[]): HomeTrendingTitle[] {
  return rows.map(({ item }) => ({
    key: `${type}-${item.ids.slug}`,
    type,
    slug: item.ids.slug,
    title: item.title,
    year: item.year ?? undefined,
    href: `/${type}/${item.ids.slug}`,
    poster: mediaImage({
      type: type === 'shows' ? 'show' : 'movie',
      id: item.ids.trakt,
      slot: 'poster',
      size: 'medium',
    }),
  }));
}
