import { describe, expect, it } from 'vitest';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import {
  isBrowserSort,
  linesBeforeRating,
  sortCardsByViewer,
  viewerSortLine,
  viewerSortReady,
  viewerSortValue,
  withViewerLine,
} from './viewerSort.ts';

const datePreferences: DatePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 };

describe('util: viewerSort', () => {
  it('should sort watched, collected and plays in the browser', () => {
    expect(['watched', 'collected', 'plays'].every(isBrowserSort)).toBe(true);
    expect(isBrowserSort('my_rating')).toBe(false);
    expect(isBrowserSort('added')).toBe(false);
  });

  it('should read the value each sort orders by', () => {
    const state = { lastWatchedAt: '2026-01-01', watchedPlays: 3, lastCollectedAt: '2025-05-05' };
    expect(viewerSortValue('watched', state)).toBe('2026-01-01');
    expect(viewerSortValue('plays', state)).toBe(3);
    expect(viewerSortValue('collected', state)).toBe('2025-05-05');
    expect(viewerSortValue('collected', { ...state, collectedAt: '2024-04-04' })).toBe('2024-04-04');
    expect(viewerSortValue('plays', { watchedPlays: 0 })).toBeUndefined();
  });

  it('should wait for the slices a sort reads', () => {
    expect(viewerSortReady('watched', { watchedMovies: new Map() })).toBe(false);
    expect(viewerSortReady('plays', { watchedMovies: new Map(), watchedShows: new Map() })).toBe(true);
    expect(viewerSortReady('collected', { watchedMovies: new Map(), watchedShows: new Map() })).toBe(false);
    expect(viewerSortReady('collected', { collectedMovies: new Map(), collectedShows: new Map() })).toBe(true);
  });

  it('should order by the value, not the rank, with the unwatched last and ties in rank order', () => {
    const watched: Record<number, string | undefined> = {
      1: '2026-03-01',
      2: undefined,
      3: '2026-05-01',
      4: '2026-03-01',
    };
    const cards = [1, 2, 3, 4].map((rank) => ({ rank }));
    const valueOf = ({ rank }: { rank: number }) => watched[rank];

    expect(sortCardsByViewer(cards, { by: 'watched', how: 'desc' }, valueOf).map(({ rank }) => rank)).toEqual([
      3, 1, 4, 2,
    ]);
    expect(sortCardsByViewer(cards, { by: 'watched', how: 'asc' }, valueOf).map(({ rank }) => rank)).toEqual([
      1, 4, 3, 2,
    ]);
  });

  it('should write the line for each sort about the viewer', () => {
    expect(viewerSortLine('watched', { lastWatchedAt: '2026-03-01T20:30:00.000Z' }, datePreferences)).toBe(
      'Mar 1, 2026 8:30 PM',
    );
    expect(viewerSortLine('watched', { lastWatchedAt: '1970-01-01T00:00:00.000Z' }, datePreferences)).toBe(
      'Unknown date',
    );
    expect(viewerSortLine('collected', { lastCollectedAt: '2026-03-01T20:30:00.000Z' }, datePreferences)).toBe(
      'Mar 1, 2026 8:30 PM',
    );
    expect(viewerSortLine('plays', { watchedPlays: 1 }, datePreferences)).toBe('1 play');
    expect(viewerSortLine('plays', { watchedPlays: 4 }, datePreferences)).toBe('4 plays');
    expect(viewerSortLine('my_rating', { rating: 8 }, datePreferences)).toBeUndefined();
    expect(viewerSortLine('added', { lastWatchedAt: '2026-03-01' }, datePreferences)).toBeUndefined();
  });

  it('should keep only the show line before a rating line', () => {
    const show = { text: 'The Boys', href: '/shows/the-boys' };
    const blank = { text: '\u00a0', href: '/x' };
    expect(linesBeforeRating({ type: 'movie', href: '/x', lines: [blank, blank] })).toEqual([]);
    expect(linesBeforeRating({ type: 'season', href: '/x', lines: [show, blank] })).toEqual([show]);
  });

  it('should put the line under the show for a season or episode', () => {
    const show = { text: 'The Boys', href: '/shows/the-boys' };
    const blank = { text: ' ', href: '/x' };
    expect(withViewerLine({ type: 'movie', href: '/x', lines: [blank, blank] }, '2 plays')).toEqual([
      { text: '2 plays', href: '/x' },
      blank,
    ]);
    expect(withViewerLine({ type: 'episode', href: '/x', lines: [show, blank] }, '2 plays')).toEqual([
      show,
      { text: '2 plays', href: '/x' },
    ]);
  });
});
