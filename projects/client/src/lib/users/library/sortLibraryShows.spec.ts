import { describe, expect, it } from 'vitest';
import { sortLibraryShows } from './sortLibraryShows.ts';

const row = (title: string, extra: { collected?: string; episodes?: number; votes?: number; aired?: string }) => ({
  last_collected_at: extra.collected ?? '2026-01-01T00:00:00.000Z',
  show: {
    title,
    ids: { trakt: title.length, slug: title },
    votes: extra.votes,
    first_aired: extra.aired,
  },
  seasons: [{ episodes: Array.from({ length: extra.episodes ?? 0 }, () => ({})) }],
});

const lost = row('Lost', {
  collected: '2026-03-01T00:00:00.000Z',
  episodes: 2,
  votes: 10,
  aired: '2004-09-22T00:00:00Z',
});
const theWire = row('The Wire', { collected: '2026-01-01T00:00:00.000Z', episodes: 9, votes: 30 });
const archer = row('Archer', {
  collected: '2026-02-01T00:00:00.000Z',
  episodes: 2,
  votes: 20,
  aired: '2009-09-17T00:00:00Z',
});
const titles = (rows: readonly { show: { title: string } }[]) => rows.map(({ show }) => show.title);

describe('sortLibraryShows', () => {
  it("should sort in each sort's own direction, ties A to Z", () => {
    const rows = [lost, theWire, archer];
    expect(titles(sortLibraryShows(rows, { by: 'added', how: 'asc' }))).toEqual(['Lost', 'Archer', 'The Wire']);
    expect(titles(sortLibraryShows(rows, { by: 'title', how: 'asc' }))).toEqual(['Archer', 'Lost', 'The Wire']);
    expect(titles(sortLibraryShows(rows, { by: 'episodes', how: 'asc' }))).toEqual(['The Wire', 'Archer', 'Lost']);
    expect(titles(sortLibraryShows(rows, { by: 'votes', how: 'asc' }))).toEqual(['The Wire', 'Archer', 'Lost']);
    expect(titles(sortLibraryShows(rows, { by: 'released', how: 'asc' }))).toEqual(['Archer', 'Lost', 'The Wire']);
  });

  it('should flip the sort on desc', () => {
    expect(titles(sortLibraryShows([lost, theWire, archer], { by: 'title', how: 'desc' }))).toEqual([
      'The Wire',
      'Lost',
      'Archer',
    ]);
  });
});
