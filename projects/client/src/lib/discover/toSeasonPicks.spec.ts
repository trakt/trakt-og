import { describe, expect, it } from 'vitest';
import type { ThemeMedia } from './themeRowsSchema.ts';
import { toSeasonPicks } from './toSeasonPicks.ts';

const art = (kind: string, id: number) => [`media.trakt.tv/images/${kind}/${id}/medium/a.jpg.webp`];
const media = (id: number, extra: Partial<ThemeMedia> = {}): ThemeMedia => ({
  ids: { trakt: id, slug: `title-${id}` },
  title: `Title ${id}`,
  year: 2020,
  images: { poster: art('posters', id), fanart: art('fanarts', id) },
  ...extra,
});
const none = { movie: [], show: [] };
const now = new Date('2026-10-07T00:00:00Z');

describe('toSeasonPicks', () => {
  it('should alternate trending movies and shows, then favorites, round by round', () => {
    const picks = toSeasonPicks({
      trending: { movie: [media(1)], show: [media(2)] },
      favorites: { movie: [media(3), media(5)], show: [media(4)] },
      now,
    });

    expect(picks.map(({ key, source }) => `${key}-${source}`)).toEqual([
      'movie-1-trending',
      'show-2-trending',
      'movie-3-favorite',
      'show-4-favorite',
      'movie-5-favorite',
    ]);
  });

  it('should fill from the favorites when nothing in the theme is trending', () => {
    expect(
      toSeasonPicks({ trending: none, favorites: { movie: [media(1), media(2)], show: [] }, now }).map(({ key }) =>
        key
      ),
    )
      .toEqual(['movie-1', 'movie-2']);
  });

  it('should skip repeats and titles without a poster', () => {
    const picks = toSeasonPicks({
      trending: { movie: [media(1), media(2, { images: { fanart: art('fanarts', 2) } })], show: [] },
      favorites: { movie: [media(1)], show: [] },
      now,
    });

    expect(picks.map(({ key }) => key)).toEqual(['movie-1']);
  });

  it('should stop at the limit', () => {
    const movies = Array.from({ length: 24 }, (_, index) => media(index + 1));

    expect(toSeasonPicks({ trending: none, favorites: { movie: movies, show: [] }, now })).toHaveLength(20);
    expect(toSeasonPicks({ trending: none, favorites: { movie: movies, show: [] }, now, limit: 3 })).toHaveLength(3);
  });
});
