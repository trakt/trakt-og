import { describe, expect, it } from 'vitest';
import type { OverlaySlices } from '../overlay/OverlaySlices.ts';
import type { OverlayState } from '../overlay/createOverlay.svelte.ts';
import { listCardHidden, listHideReady } from './listHide.ts';
import type { ListItemCard } from './toListItemCard.ts';

const NOW = new Date('2026-11-13T12:00:00Z');

const card = (fields: Partial<ListItemCard> = {}): ListItemCard => ({
  key: 1,
  type: 'movie',
  id: 10,
  href: '/movies/heat-1995',
  title: 'Heat',
  rank: 1,
  listRuntime: 170,
  lines: [
    { text: ' ', href: '/movies/heat-1995' },
    { text: ' ', href: '/movies/heat-1995' },
  ],
  noteTitle: { title: 'Heat' },
  ...fields,
});

const hidden = ({
  hide,
  item = card(),
  state = {},
  signedIn = true,
}: {
  hide: string[];
  item?: ListItemCard;
  state?: OverlayState;
  signedIn?: boolean;
}) => listCardHidden({ card: item, hide, state, signedIn, now: NOW });

describe('listCardHidden', () => {
  describe('for the library', () => {
    it('should hide an item not in the library with Not In Library', () => {
      expect(hidden({ hide: ['uncollected'], state: { collected: false } })).toBe(true);
      expect(hidden({ hide: ['uncollected'], state: { collected: true } })).toBe(false);
    });

    it('should hide a whole show in the library, and a partial one only with Partially In Library', () => {
      const show = card({ type: 'show', airedEpisodes: 10 });
      const partial: OverlayState = { collected: true, collectedEpisodes: 4 };
      const whole: OverlayState = { collected: true, collectedEpisodes: 10 };
      expect(hidden({ hide: ['collected'], item: show, state: whole })).toBe(true);
      expect(hidden({ hide: ['collected'], item: show, state: partial })).toBe(false);
      expect(hidden({ hide: ['collecting'], item: show, state: partial })).toBe(true);
    });
  });

  describe('for the viewer state', () => {
    it('should hide by watched, watchlist, lists and ratings', () => {
      expect(hidden({ hide: ['unwatched'], state: { watched: false, plays: 0 } })).toBe(true);
      expect(hidden({ hide: ['unwatchlisted'], state: { watchlisted: false } })).toBe(true);
      expect(hidden({ hide: ['listed'], state: { listed: true } })).toBe(true);
      expect(hidden({ hide: ['unlisted'], state: { listed: false } })).toBe(true);
      expect(hidden({ hide: ['unrated'], state: { rating: null } })).toBe(true);
      expect(hidden({ hide: ['rated'], state: { rating: 8 } })).toBe(true);
    });

    it('should not hide by the viewer state for a signed-out visitor', () => {
      expect(hidden({ hide: ['uncollected'], state: { collected: false }, signedIn: false })).toBe(false);
    });
  });

  describe('for notes', () => {
    it('should hide by the item notes, treating blank notes as none', () => {
      expect(hidden({ hide: ['notes'], item: card({ notes: 'A favorite.' }) })).toBe(true);
      expect(hidden({ hide: ['nonotes'], item: card() })).toBe(true);
      expect(hidden({ hide: ['nonotes'], item: card({ notes: 'A favorite.' }) })).toBe(false);
    });
  });

  describe('for releases', () => {
    const released = card({ release: { at: '1995-12-15', status: 'released' } });
    const upcoming = card({ release: { at: '2027-05-01', status: 'post production' } });
    const undated = card({ release: { at: null, status: 'in production' } });

    it('should hide by release date', () => {
      expect(hidden({ hide: ['released'], item: released })).toBe(true);
      expect(hidden({ hide: ['released'], item: upcoming })).toBe(false);
      expect(hidden({ hide: ['unreleased'], item: upcoming })).toBe(true);
      expect(hidden({ hide: ['unreleased'], item: undated })).toBe(true);
      expect(hidden({ hide: ['noreleasedate'], item: undated })).toBe(true);
      expect(hidden({ hide: ['noreleasedate'], item: released })).toBe(false);
    });

    it('should hide ended and airing shows, and canceled movies', () => {
      const show = (status: string) => card({ type: 'show', release: { at: '2008-01-20', status } });
      expect(hidden({ hide: ['ended'], item: show('ended') })).toBe(true);
      expect(hidden({ hide: ['ended'], item: show('canceled') })).toBe(true);
      expect(hidden({ hide: ['ended'], item: card({ release: { at: null, status: 'canceled' } }) })).toBe(true);
      expect(hidden({ hide: ['airing'], item: show('returning series') })).toBe(true);
      expect(hidden({ hide: ['airing'], item: show('ended') })).toBe(false);
    });

    it('should keep seasons, episodes and people, which have no release facts', () => {
      expect(hidden({ hide: ['unreleased', 'noreleasedate'], item: card({ type: 'season' }) })).toBe(false);
    });
  });
});

describe('listHideReady', () => {
  const slices = (names: (keyof OverlaySlices)[]) =>
    Object.fromEntries(names.map((name) => [name, new Map()])) as Partial<OverlaySlices>;

  it('should wait for the slices the hides read', () => {
    expect(listHideReady({ hide: ['uncollected'], slices: slices(['watchedMovies']), signedIn: true })).toBe(false);
    expect(
      listHideReady({ hide: ['uncollected'], slices: slices(['collectedMovies', 'collectedShows']), signedIn: true }),
    ).toBe(true);
  });

  it('should not wait for notes, releases or a signed-out visitor', () => {
    expect(listHideReady({ hide: ['notes', 'released'], slices: {}, signedIn: true })).toBe(true);
    expect(listHideReady({ hide: ['watched'], slices: {}, signedIn: false })).toBe(true);
  });
});
