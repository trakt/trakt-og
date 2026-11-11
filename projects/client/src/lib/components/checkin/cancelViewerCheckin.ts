import { rawApiFetch } from '#lib/api/rawApiFetch.ts';
import { toast } from '#lib/components/toast/toast.svelte.ts';
import type { WatchingNow } from '#lib/users/WatchingNow.ts';
import { viewerWatching } from '#lib/users/viewerWatching.svelte.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';
import { cancelCheckin } from './cancelCheckin.ts';

/** Cancels the signed-in viewer's check-in from the browser: the watching-now bar's ✕ and the summary's. */
export const cancelViewerCheckin = (watching: WatchingNow) =>
  cancelCheckin({
    watching,
    remove: () => rawApiFetch({ fetch: viewerFetch(), path: '/checkin', init: { method: 'DELETE' } }),
    notify: toast,
    clear: () => viewerWatching.clear(),
  });
