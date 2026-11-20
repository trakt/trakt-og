import { describe, expect, it } from 'vitest';
import { UNKNOWN_DATE } from '../../utils/unknownDate.ts';
import { watchedItemsSchema } from '../profile/watchedItemsSchema.ts';
import { historyRowsSchema, watchedMoviesSchema } from './historyRowsSchema.ts';

const movie = { ids: { trakt: 7, slug: 'heat-1995' }, title: 'Heat' };
const dated = '2026-10-01T20:00:00.000Z';

describe('schema: undated movie plays', () => {
  it('should read a null watched_at as the unknown date, next to dated plays', () => {
    const rows = historyRowsSchema.parse([
      { id: 1, watched_at: dated, movie },
      { id: 2, watched_at: null, movie },
    ]);
    expect(rows.map((row) => row.watched_at)).toEqual([dated, UNKNOWN_DATE]);
  });

  it('should read a null last_watched_at as the unknown date on the Movies tab', () => {
    const [row] = watchedMoviesSchema.parse([{ plays: 1, last_watched_at: null, movie }]);
    expect(row?.last_watched_at).toBe(UNKNOWN_DATE);
  });

  it('should read a null last_watched_at as the unknown date for Most Watched', () => {
    const [row] = watchedItemsSchema.parse([{ plays: 1, last_watched_at: null, movie }]);
    expect(row?.last_watched_at).toBe(UNKNOWN_DATE);
  });

  it('should still reject a missing date', () => {
    expect(() => historyRowsSchema.parse([{ id: 1, movie }])).toThrow();
  });
});
