import { api } from '../api/api.ts';
import { type SectionsClient, sectionsClient } from './sectionsClient.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';

const clients = new Map<boolean, SectionsClient>();

/**
 * The lazy sections' client in the browser: public calls go anonymous, the rest with the signed-in member's token.
 * Only call it from the browser (a section's `load`), since it reaches for the stored user.
 */
export function browserSectionsClient(signedIn: boolean): SectionsClient {
  const existing = clients.get(signedIn);
  if (existing) return existing;

  const signedInFetch = viewerFetch();
  const client = sectionsClient({
    anonymous: api(),
    viewer: api({ fetch: signedInFetch }),
    viewerFetch: signedInFetch,
    signedIn,
  });
  clients.set(signedIn, client);
  return client;
}
