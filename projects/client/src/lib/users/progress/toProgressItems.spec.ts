import { describe, expect, it } from 'vitest';
import type { OverlaySlices } from '../../overlay/OverlaySlices.ts';
import type { CachedShow } from '../../shows/cache/CachedShow.ts';
import type { ShowCatalog } from '../../shows/cache/ShowCatalog.ts';
import { filterProgress } from './filterProgress.ts';
import { progressItemFixture } from './progressItemFixture.ts';
import { toProgressItems } from './toProgressItems.ts';

const options = { includeSpecials: false, useLastActivity: false };
const none = { shows: new Set<number>(), seasons: new Map<number, ReadonlySet<number>>() };

// Shows 1 to 5 from the endpoint: 2 is being rewatched, 3 was dropped, 4 is hidden from progress, 5 hidden just now.
const nitro = [1, 2, 3, 4, 5].map((id) => progressItemFixture(id));
const slices: Partial<OverlaySlices> = {
  rewatching: new Map([[2, '2026-07-02T00:00:00.000Z']]),
  dropped: new Map([
    [3, '2026-02-01T00:00:00.000Z'],
    [6, '2026-03-01T00:00:00.000Z'],
  ]),
  progressHidden: { watched: { shows: new Set([4]), seasons: new Map() }, collected: none },
  hidden: new Map([['progress_watched', new Set(['show:5'])]]),
  // Show 1: two episodes watched, one of them twice. The endpoint claims 5.
  watchedShows: new Map([
    [
      1,
      new Map([
        [
          1,
          new Map([
            [11, ['2026-01-02T00:00:00Z', '2026-01-01T00:00:00Z']],
            [12, ['2026-01-03T00:00:00Z']],
          ]),
        ],
      ]),
    ],
  ]),
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
  it('should wait for the overlay to know your dropped, hidden and watched shows', () => {
    expect(toProgressItems({ ...base, type: 'watched', slices: { rewatching: new Map() } })).toBeNull();
  });

  it('should take who you’re rewatching from the endpoint while the overlay doesn’t know', () => {
    const { rewatching: _, ...rest } = slices;
    const resetAt = '2026-08-01T00:00:00.000Z';
    const items = toProgressItems({
      ...base,
      type: 'rewatching',
      nitro: nitro.map((item) => (item.show.id === 1 ? { ...item, resetAt } : item)),
      slices: rest,
    });
    expect(ids(items)).toEqual([1]);
    expect(items?.at(0)?.resetAt).toBe(resetAt);
  });

  it('should trust the overlay over the endpoint once it knows, so a stopped rewatch drops off at once', () => {
    const items = toProgressItems({
      ...base,
      type: 'rewatching',
      nitro: nitro.map((item) => (item.show.id === 1 ? { ...item, resetAt: '2026-08-01T00:00:00.000Z' } : item)),
    });
    expect(ids(items)).toEqual([2]);
  });

  it('should list the endpoint’s shows on Watched, minus the dropped and hidden ones', () => {
    expect(ids(toProgressItems({ ...base, type: 'watched' }))).toEqual([1, 2]);
  });

  it('should list every show on a list on Watched, unstarted, dropped and hidden ones too', () => {
    const listShows = new Map([1, 3, 4, 6].map((id) => [id, { ...droppedShow, id, slug: `show-${id}` }]));
    const items = toProgressItems({ ...base, type: 'watched', listShows });
    expect(ids(items)).toEqual([1, 3, 4, 6]);
    expect(items?.find(({ show }) => show.id === 6)).toMatchObject({ completed: 0, plays: 0 });
  });

  it('should keep filtering Rewatching by its own rule with a list', () => {
    const listShows = new Map([1, 2, 6].map((id) => [id, { ...droppedShow, id }]));
    expect(ids(toProgressItems({ ...base, type: 'rewatching', listShows }))).toEqual([2]);
  });

  it('should count watches and plays from the overlay, not the endpoint’s completed count', () => {
    expect(toProgressItems({ ...base, type: 'watched' })?.at(0)).toMatchObject({
      aired: 10,
      completed: 2,
      plays: 3,
      minutesWatched: 90,
      minutesLeft: 240,
      lastAt: '2026-01-03T00:00:00Z',
    });
  });

  it('should keep a show the endpoint files as completed unfinished when an aired episode is unwatched', () => {
    const filed = (aired: number) =>
      toProgressItems({
        ...base,
        type: 'watched',
        nitro: nitro.map((item) => (item.show.id === 1 ? { ...item, aired, completed: aired } : item)),
      }) ?? [];
    const unfinished = filed(3);
    expect(unfinished.at(0)).toMatchObject({ aired: 3, completed: 2 });
    expect(ids(filterProgress(unfinished, { hide: ['completed'] }))).toEqual([1, 2]);
    expect(ids(filterProgress(filed(2), { hide: ['completed'] }))).toEqual([2]);
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

  it('should count from the catalog once it’s in, so the totals match the season lines', () => {
    const catalog: ShowCatalog = {
      id: 1,
      fetchedAt: 0,
      seasons: [
        {
          number: 1,
          episodes: [{ id: 11, season: 1, number: 1, firstAired: '2026-01-01T00:00:00.000Z' }],
        },
      ],
    };
    const items = toProgressItems({ ...base, type: 'watched', catalogs: new Map([[1, catalog]]), now: Date.now() });

    expect(items?.at(0)).toMatchObject({ aired: 1, completed: 1, plays: 2, exact: true });
    expect(items?.at(0)?.detail?.seasons.map(({ number }) => number)).toEqual([1]);
  });

  describe('for the next episode once the catalog is in', () => {
    const aired = '2026-01-01T00:00:00.000Z';
    const catalog: ShowCatalog = {
      id: 1,
      fetchedAt: 0,
      seasons: [
        {
          number: 1,
          episodes: [11, 12, 13, 14].map((id) => ({ id, season: 1, number: id - 10, firstAired: aired })),
        },
      ],
    };
    const withNext = (id: number) =>
      nitro.map((item) =>
        item.show.id === 1 ? { ...item, next: { id, season: 1, number: id - 10, screenshot: 'shot.jpg' } } : item,
      );
    const next = (id: number) =>
      toProgressItems({
        ...base,
        type: 'watched',
        nitro: withNext(id),
        catalogs: new Map([[1, catalog]]),
        now: Date.now(),
      })?.at(0)?.next;

    it('should follow your watches without waiting on the endpoint', () => {
      expect(next(12)).toMatchObject({ id: 13, number: 3 });
      expect(next(12)?.screenshot).toBeUndefined();
    });

    it('should keep the endpoint’s copy of the same episode, with its screenshot', () => {
      expect(next(13)).toMatchObject({ id: 13, screenshot: 'shot.jpg' });
    });
  });
});
