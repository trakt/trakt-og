import { describe, expect, it } from 'vitest';
import { createOverlay } from '../../overlay/createOverlay.svelte.ts';
import type { PickerList } from './PickerList.ts';
import { syncPickerOverlay } from './syncPickerOverlay.ts';

const list = (id: number, selected: boolean): PickerList => ({
  id,
  name: `List ${id}`,
  count: 1,
  privacy: 'private',
  rank: id,
  owner: 'me',
  collaboration: false,
  selected,
});

describe('syncPickerOverlay', () => {
  it('should reconcile fresh membership for seasons without changing other items', () => {
    const overlay = createOverlay({
      get: () => Promise.resolve(new Response(null, { status: 503 })),
      storage: { load: () => Promise.resolve([]), save: () => Promise.resolve(), clearExcept: () => Promise.resolve() },
    });
    syncPickerOverlay({
      overlay,
      target: { type: 'episode', id: 1, title: 'Pilot' },
      lists: [list(7, true), list(8, false)],
      watchlisted: false,
    });
    syncPickerOverlay({
      overlay,
      target: { type: 'season', id: 2, title: 'Season 1' },
      lists: [list(7, false), list(8, true)],
      watchlisted: true,
    });
    expect(overlay.state('episode', 1).lists).toEqual([{ id: 7, name: 'List 7', collaboration: false }]);
    expect(overlay.state('season', 2).lists).toEqual([{ id: 8, name: 'List 8', collaboration: false }]);
    expect(overlay.state('season', 2).watchlisted).toBe(true);
    expect(overlay.watchlistCount()).toBe(1);
    syncPickerOverlay({
      overlay,
      target: { type: 'season', id: 2, title: 'Season 1' },
      lists: [list(7, false), list(8, false)],
      watchlisted: false,
    });
    expect(overlay.state('episode', 1).listed).toBe(true);
    expect(overlay.state('season', 2).listed).toBe(false);
    expect(overlay.watchlistCount()).toBe(0);
  });
});
