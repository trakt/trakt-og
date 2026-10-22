import { rawApiFetch } from '../api/rawApiFetch.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';

/** Browser-only writes use the token owner and renewal path, never the SSR cookie. */
export function relationshipRequest(path: string, method: 'POST' | 'DELETE') {
  return rawApiFetch({ fetch: viewerFetch(), path, init: { method } });
}
