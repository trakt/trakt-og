import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { toast } from '../toast/toast.svelte.ts';
import { createCommentReactions } from './createCommentReactions.svelte.ts';
import { viewerFetch } from '../../auth/viewerFetch.ts';

/** The browser's shared reaction state. It stays empty on the server. */
export const commentReactions = createCommentReactions({
  request: (path, init) => rawApiFetch({ fetch: viewerFetch(), path, init }),
  notify: (message) => toast.error(message),
});
