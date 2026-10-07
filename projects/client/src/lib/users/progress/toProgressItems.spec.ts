import { describe, expect, it } from 'vitest';
import type { OverlaySlices } from '../../overlay/OverlaySlices.ts';
import type { CachedShow } from '../../shows/cache/CachedShow.ts';
import type { ShowCatalog } from '../../shows/cache/ShowCatalog.ts';
import { progressItemFixture } from './progressItemFixture.ts';
import { toProgressItems } from './toProgressItems.ts';

const options = { includeSpecials: false, useLastActivity: false };
const none = { shows: new Set<number>(), seasons: new Map<number, ReadonlySet<number>>() };

// Shows 1 to 5 from the endpoint: 2 is being rewatched, 3 was dropped, 4 is hidden from progress, 5 hidden just now.
const nitro = [1, 2, 3, 4, 5].map((id) => progressItemFixture(id));
const slices: Partial<OverlaySlices> = {
  rewatching: new Map([[2, '2026-07-02T00:00:00.000Z']]),
  dropped: new Map([[3, '2026-02-01T00:00:00.000Z'], [6, '2026-03-01T00:00:00.000Z']]),
  progressHidden: { watched: { shows: new Set([4]), seasons: new Map() }, collected: none },
  hidden: new Map([['progress_watched', new Set(['show:5'])]]),
};
const base = { nitro, slices, catalogs: new Map<number, ShowCatalog>(), options, now: 0 };
const ids = (items: ReturnType<typeof toProgressItems>) => items?.map(({ show }) => show.id);

const droppedShow: CachedShow = {
  id: 6,
  slug: 'show-6',
  title: 'Show 6',
  genres: [],
  runtime: 30,
  airedEpisodes: 4,
  fetchedAt: 0,
  complete: true,
};

describe('toProgressItems', () => {
  it('should wait for the overlay to know your dropped, rewatching and hidden shows', () => {
    expect(toProgressItems({ ...base, type: 'watched', slices: { rewatching: new Map() } })).toBeNull();
  });

  it('should list the endpoint’s shows on Watched, minus the dropped and hidden ones', () => {
    expect(ids(toProgressItems({ ...base, type: 'watched' }))).toEqual([1, 2]);
  });

  it('should keep only the shows you’re rewatching on Rewatching, with the reset date', () => {
    const items = toProgressItems({ ...base, type: 'rewatching' });
    expect(ids(items)).toEqual([2]);
    expect(items?.at(0)?.resetAt).toBe('2026-07-02T00:00:00.000Z');
  });

  it('should keep the dropped shows on Dropped, counting any the endpoint left out from the overlay', () => {
    const items = toProgressItems({
      ...base,
      type: 'dropped',
      droppedShows: new Map([[6, droppedShow]]),
      slices: { ...slices, watchedShows: new Map([[6, new Map([[1, new Map([[61, ['2026-01-01T00:00:00Z']]])]])]]) },
    });

    expect(ids(items)).toEqual([3, 6]);
    expect(items?.at(0)?.droppedAt).toBe('2026-02-01T00:00:00.000Z');
    expect(items?.at(1)).toMatchObject({ aired: 4, completed: 1, droppedAt: '2026-03-01T00:00:00.000Z' });
  });

  it('should add the season lines once a show’s catalog is in, and keep the endpoint’s counts', () => {
    const catalog: ShowCatalog = {
      id: 1,
      fetchedAt: 0,
      seasons: [{
        number: 1,
        episodes: [{ id: 11, season: 1, number: 1, firstAired: '2026-01-01T00:00:00.000Z' }],
      }],
    };
    const items = toProgressItems({ ...base, type: 'watched', catalogs: new Map([[1, catalog]]), now: Date.now() });

    expect(items?.at(0)).toMatchObject({ aired: 10, completed: 5 });
    expect(items?.at(0)?.detail?.seasons.map(({ number }) => number)).toEqual([1]);
  });
});
