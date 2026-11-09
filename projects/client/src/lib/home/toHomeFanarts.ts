import { mediaImage } from '../images/mediaImage.ts';

export type HomeFanartSource = {
  readonly type: 'movie' | 'show';
  readonly id: number;
  readonly slug: string;
  readonly title: string;
};

export type HomeFanart = {
  /** `movie-the-goonies-1985` or `show-breaking-bad`. */
  readonly key: string;
  readonly title: string;
  readonly href: string;
  /** The full-size fanart, 1920px wide. */
  readonly image: string;
};

const toFanart = ({ type, id, slug, title }: HomeFanartSource): HomeFanart => ({
  key: `${type}-${slug}`,
  title,
  href: `/${type}s/${slug}`,
  image: mediaImage({ type, id, slot: 'fanart', size: 'full' }),
});

/** The titles as hero slides. */
export function toHomeFanarts(sources: readonly HomeFanartSource[]): HomeFanart[] {
  return sources.map(toFanart);
}
