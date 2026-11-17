import { apiQueue } from '../api/apiQueue.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';
import { createLastActivities } from './createLastActivities.ts';

/** The app's one `last_activities` reader, with the browser's signed-in user. Read it only in the browser. */
export const lastActivities = createLastActivities({
  get: (path) => apiQueue.run(() => rawApiFetch({ fetch: viewerFetch(), path })),
});
