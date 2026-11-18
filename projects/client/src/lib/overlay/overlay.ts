import { lastActivities } from '../activity/lastActivities.ts';
import { apiQueue } from '../api/apiQueue.ts';
import { recentReads } from '../api/recentReads.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { createOverlay } from './createOverlay.svelte.ts';
import { overlayStorage } from './overlayStorage.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';

/** The app's one overlay. Components read `overlay.state(type, id)`; it stays empty on the server and until sign-in. */
export const overlay = createOverlay({
  get: (path) => apiQueue.run(() => rawApiFetch({ fetch: viewerFetch(), path })),
  storage: overlayStorage(),
  activities: lastActivities.read,
  // A play, rating or list change can move a page's kept reads (your progress, a list's stats), so they read again.
  onWrite: recentReads.forget,
});
