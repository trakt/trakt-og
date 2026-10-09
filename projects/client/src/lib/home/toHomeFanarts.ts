import { imageUrl } from '../utils/imageUrl.ts';

export type HomeFanartSource = {
  readonly type: 'movie' | 'show';
  readonly slug: string;
  readonly title: string;
  /** The summary's first fanart path, as `extended=images` returns it. */
  readonly fanart: string | null | undefined;
};

export type HomeFanart = {
  /** `movie-the-goonies-1985` or `show-breaking-bad`. */
  readonly key: string;
  readonly title: string;
  readonly href: string;
  /** The full-size fanart, 1920px wide. */
  readonly image: string;
};

const toFanart = ({ type, slug, title, fanart }: HomeFanartSource): HomeFanart | null => {
  const image = imageUrl(fanart, 'full');
  if (!image) return null;
  return { key: `${type}-${slug}`, title, href: `/${type}s/${slug}`, image };
};

/** The titles that have fanart, as hero slides. */
export function toHomeFanarts(sources: readonly HomeFanartSource[]): HomeFanart[] {
  return sources.map(toFanart).filter((fanart) => fanart !== null);
}
