import type { EpisodeResponse } from '@trakt/api';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { recentReads } from '../api/recentReads.ts';
import { createViewerShowProgress } from './createViewerShowProgress.svelte.ts';
import { fetchShowProgress } from './fetchShowProgress.ts';
import type { ShowProgressBase } from './toShowProgress.ts';
import type { EpisodeCard } from './toShowSummary.ts';

vi.mock('../auth/viewerFetch.ts', () => ({ viewerFetch: () => fetch }));
vi.mock('./fetchShowProgress.ts', () => ({ fetchShowProgress: vi.fn() }));

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const card = (id: number) => ({ id, number: `1x0${id}` }) as unknown as EpisodeCard;
const base: ShowProgressBase = {
  context: { showId: 1, href: '/shows/x', episodeTypeTags: true, timeZone: 'UTC' },
  aired: [card(3), card(2), card(1)],
};
const watchNext = {
  season: 1,
  number: 2,
  title: 'Two',
  first_aired: '2026-09-08T00:00:00Z',
  ids: { trakt: 2 },
} as EpisodeResponse;

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  recentReads.forget();
  vi.mocked(fetchShowProgress).mockReset();
});

const track = (params: () => Parameters<typeof createViewerShowProgress>[0] extends () => infer P ? P : never) => {
  let viewer!: ReturnType<typeof createViewerShowProgress>;
  cleanups.push(
    $effect.root(() => {
      viewer = createViewerShowProgress(params);
    }),
  );
  flushSync();
  return viewer;
};

describe('createViewerShowProgress', () => {
  it('should not read anything signed out', () => {
    const viewer = track(() => ({ showId: 1, base: null, datePreferences }));

    expect(viewer.view).toBeNull();
    expect(fetchShowProgress).not.toHaveBeenCalled();
  });

  it('should hold the view back until the read lands, then put the progress on it', async () => {
    vi.mocked(fetchShowProgress).mockResolvedValue({ next_episode: watchNext });
    const viewer = track(() => ({ showId: 1, base, datePreferences }));

    expect(viewer.view).toBeUndefined();
    await vi.waitFor(() => expect(viewer.view).not.toBeUndefined());
    expect(viewer.view?.recent.upNext).toBe(true);
    expect(viewer.view?.recent.next?.title).toBe('Two');
  });

  it('should give null when the read fails, so the page keeps its signed-out view', async () => {
    vi.mocked(fetchShowProgress).mockResolvedValue(null);
    const viewer = track(() => ({ showId: 1, base, datePreferences }));

    await vi.waitFor(() => expect(viewer.view).toBeNull());
  });

  it('should show the kept progress at once on the next visit, and read again after a write', async () => {
    vi.mocked(fetchShowProgress).mockResolvedValue({ next_episode: watchNext });
    const first = track(() => ({ showId: 1, base, datePreferences }));
    await vi.waitFor(() => expect(first.view).not.toBeUndefined());

    const again = track(() => ({ showId: 1, base, datePreferences }));
    await vi.waitFor(() => expect(again.view).not.toBeUndefined());
    expect(fetchShowProgress).toHaveBeenCalledTimes(1);

    recentReads.forget();
    track(() => ({ showId: 1, base, datePreferences }));
    expect(fetchShowProgress).toHaveBeenCalledTimes(2);
  });

  it('should go back to waiting when the page moves to another show', async () => {
    vi.mocked(fetchShowProgress).mockResolvedValue({ next_episode: watchNext });
    let showId = $state(1);
    const viewer = track(() => ({ showId, base, datePreferences }));
    await vi.waitFor(() => expect(viewer.view).not.toBeUndefined());

    vi.mocked(fetchShowProgress).mockReturnValue(new Promise(() => {}));
    showId = 2;
    flushSync();

    expect(viewer.view).toBeUndefined();
    expect(fetchShowProgress).toHaveBeenLastCalledWith(expect.objectContaining({ showId: 2 }));
  });
});
