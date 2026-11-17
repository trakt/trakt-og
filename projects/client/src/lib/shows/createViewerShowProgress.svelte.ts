import type { DatePreferences } from '../settings/DatePreferences.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';
import { fetchShowProgress } from './fetchShowProgress.ts';
import { type ShowProgress, type ShowProgressBase, toShowProgress } from './toShowProgress.ts';

type Params = {
  showId: number;
  /** Null signed out, where there's no progress to read. */
  base: ShowProgressBase | null;
  datePreferences: DatePreferences;
};

/**
 * A signed-in viewer's progress on a show, read in the browser after paint so the server renders without it. `view`
 * is undefined while it loads, and null when there is none to show: signed out, or the read failed.
 */
export function createViewerShowProgress(params: () => Params) {
  let read = $state.raw<{ showId: number; progress: ShowProgress | null; now: Date }>();

  $effect(() => {
    const { showId, base } = params();
    if (!base) return;
    let current = true;
    void fetchShowProgress({ fetch: viewerFetch(), showId }).then((progress) => {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- the time the read landed, never mutated
      if (current) read = { showId, progress, now: new Date() };
    });
    return () => {
      current = false;
    };
  });

  return {
    get view() {
      const { showId, base, datePreferences } = params();
      if (!base) return null;
      if (read?.showId !== showId) return undefined;
      return read.progress && toShowProgress({ base, progress: read.progress, datePreferences, now: read.now });
    },
  };
}
