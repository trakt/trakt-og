import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WatchingNow } from './WatchingNow.ts';

const episode: WatchingNow = {
  action: 'scrobble',
  title: 'Severance',
  episode: { number: '2x04', title: "Woe's Hollow" },
  href: '/shows/severance/seasons/2/episodes/4',
  fanartUrl: null,
  stillUrl: null,
  endsAt: '2026-11-10T21:00:00Z',
  runtime: 50,
};
const movie: WatchingNow = { ...episode, title: 'Fight Club', episode: null, href: '/movies/fight-club-1999' };

// The store is one per page, so each spec starts from a fresh module.
async function freshStore() {
  vi.resetModules();
  return (await import('./viewerWatching.svelte.ts')).viewerWatching;
}

let store: Awaited<ReturnType<typeof freshStore>>;
beforeEach(async () => {
  store = await freshStore();
});

describe('viewerWatching', () => {
  it('should know nothing until a page or a read says', () => {
    expect(store.current).toBeUndefined();
    expect(store.latest(episode)).toBe(episode);
  });

  it("should take a page's answer over the page's own copy", () => {
    store.seed(null, 0);

    expect(store.current).toBeNull();
    expect(store.latest(episode)).toBeNull();
  });

  it('should skip a read while a page just answered', async () => {
    const load = vi.fn(() => Promise.resolve(movie));
    store.seed(episode, 0);

    await store.refresh({ load, maxAge: 60_000, now: () => 30_000 });
    expect(load).not.toHaveBeenCalled();

    await store.refresh({ load, maxAge: 60_000, now: () => 60_000 });
    expect(store.current).toBe(movie);
  });

  it('should ignore the same page answer handed over again', async () => {
    store.seed(episode, 0);
    await store.refresh({ load: () => Promise.resolve(null), now: () => 1 });

    store.seed(episode, 2);
    expect(store.current).toBeNull();
  });

  it('should keep what it had when a read fails', async () => {
    store.seed(episode, 0);
    await store.refresh({ load: () => Promise.reject(new Error('502')), now: () => 1 });

    expect(store.current).toBe(episode);
  });

  it('should drop a read that a newer answer overtook', async () => {
    let answer: (value: WatchingNow | null) => void = () => {};
    const pending = store.refresh({ load: () => new Promise((resolve) => (answer = resolve)), now: () => 1 });

    store.clear(2);
    answer(movie);
    await pending;

    expect(store.current).toBeNull();
  });
});
