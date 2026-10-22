import { apiQueue } from '../api/apiQueue.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { createOverlay } from './createOverlay.svelte.ts';
import { overlayStorage } from './overlayStorage.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';

/** The app's one overlay. Components read `overlay.state(type, id)`; it stays empty on the server and until sign-in. */
export const overlay = createOverlay({
  get: (path) => apiQueue.run(() => rawApiFetch({ fetch: viewerFetch(), path })),
  storage: overlayStorage(),
});
