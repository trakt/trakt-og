import { imageUrl } from '../../utils/imageUrl.ts';
import type { HomeMediaType } from './toHomeLive.ts';

/** A trending row as `/{type}/trending?extended=images` returns it, with the show or movie under its type's key. */
export type HomeTrendingRow = {
  readonly watchers: number;
  readonly item: {
    readonly title: string;
    readonly year?: number | null;
    readonly ids: { readonly slug: string };
    readonly images?: { readonly poster?: readonly string[] | null } | null;
  };
};

export type HomeTrendingTitle = {
  readonly key: string;
  readonly type: HomeMediaType;
  readonly slug: string;
  readonly title: string;
  readonly year: number | undefined;
  readonly href: string;
  /** Undefined when the title has no poster; the card shows the placeholder. */
  readonly poster: string | undefined;
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
    poster: imageUrl(item.images?.poster?.at(0), 'medium'),
  }));
}
