import { describe, expect, it } from 'vitest';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import { toFavoriteCard, toWatchedEpisode, toWatchedMovie } from './toProfileSummary.ts';

const prefs: DatePreferences = { order: 'mdy', hour24: false, timeZone: 'America/Los_Angeles', weekStartDay: 0 };

const show = {
  title: 'Andor',
  year: 2022,
  ids: { trakt: 1, slug: 'andor' },
  genres: ['drama'],
  runtime: 45,
  images: { fanart: ['media.trakt.tv/images/shows/000/000/001/fanarts/medium/a.jpg.webp'] },
};
const episodeRow = {
  id: 10,
  watched_at: '2026-09-29T05:00:00.000Z',
  show,
  episode: {
    season: 2,
    number: 1,
    title: 'One Year Later',
    ids: { trakt: 100 },
    rating: 8.4,
    runtime: null,
    images: { screenshot: ['media.trakt.tv/images/episodes/000/000/100/screenshots/medium/b.jpg.webp'] },
  },
} as unknown as Parameters<typeof toWatchedEpisode>[0];
const movieRow = {
  id: 11,
  watched_at: '2026-09-28T05:00:00.000Z',
  movie: {
    title: 'Heat',
    year: 1995,
    ids: { trakt: 200, slug: 'heat-1995' },
    rating: 8.1,
    runtime: 170,
    images: {
      poster: ['media.trakt.tv/images/movies/000/000/200/posters/medium/c.jpg.webp'],
      fanart: ['media.trakt.tv/images/movies/000/000/200/fanarts/medium/d.jpg.webp'],
    },
  },
} as unknown as Parameters<typeof toWatchedMovie>[0];

describe('toWatchedEpisode', () => {
  it('should title the card with the episode and put the show and watch date under it', () => {
    expect(toWatchedEpisode(episodeRow, prefs)).toEqual({
      key: 10,
      type: 'episode',
      id: 100,
      href: '/shows/andor/seasons/2/episodes/1',
      number: '2x01',
      title: 'One Year Later',
      image: 'https://media.trakt.tv/images/episodes/000/000/100/screenshots/thumb/b.jpg.webp',
      rating: 8.4,
      episodeBadge: { label: 'Season Premiere', kind: 'season-premiere' },
      show: { text: 'Andor', href: '/shows/andor' },
      watchedDate: 'Sep 28, 2026 10:00 PM',
    });
  });
});

describe('toWatchedMovie', () => {
  it('should map the poster and watch date', () => {
    expect(toWatchedMovie(movieRow, prefs)).toMatchObject({
      key: 11,
      href: '/movies/heat-1995',
      title: 'Heat',
      image: 'https://media.trakt.tv/images/movies/000/000/200/posters/thumb/c.jpg.webp',
      watchedDate: 'Sep 27, 2026 10:00 PM',
    });
  });
});

describe('toFavoriteCard', () => {
  it('should build the gradient from the poster colors, else OG gray', () => {
    const row = {
      type: 'show',
      notes: '  Best show ever  ',
      show: { ...show, colors: { poster: ['#FBB91E', '#A74B2B'] }, aired_episodes: 24 },
    } as unknown as Parameters<typeof toFavoriteCard>[0];

    expect(toFavoriteCard(row)).toMatchObject({
      href: '/shows/andor',
      typeLabel: 'Show',
      year: 2022,
      gradient: ['#FBB91E', '#A74B2B'],
      notes: 'Best show ever',
      airedEpisodes: 24,
    });
    expect(toFavoriteCard({ ...row, notes: null, show: { ...show } } as typeof row)).toMatchObject({
      gradient: ['#555', '#222'],
      notes: null,
    });
  });
});
