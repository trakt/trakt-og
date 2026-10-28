import type { UserManager } from 'oidc-client-ts';
import { renewAccessToken } from './renewAccessToken.ts';

type AuthenticatedFetchParams = {
  manager: UserManager;
  baseFetch?: typeof fetch;
};

// Per manager, the renewed tokens the API still refused. Renewing again can't help those, and each try would spend a
// refresh at auth.trakt.tv, so a route that keeps refusing gets its 401 until the token expires.
const refusedWhenFresh = new WeakMap<UserManager, Set<string>>();

function refusedTokens(manager: UserManager): Set<string> {
  const known = refusedWhenFresh.get(manager);
  if (known) return known;

  const created = new Set<string>();
  refusedWhenFresh.set(manager, created);
  return created;
}

/**
 * Browser fetch for apiz that sends the stored user's Bearer token. A 401 renews the token and retries once, unless a
 * renewed token that hasn't expired was refused already.
 * Pass it to `api({ fetch })` or `rawApiFetch({ fetch })` without a `token`.
 */
export function authenticatedFetch({ manager, baseFetch = globalThis.fetch }: AuthenticatedFetchParams): typeof fetch {
  return async (input, init) => {
    const send = (token: string | undefined) => {
      const headers = new Headers(init?.headers);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return baseFetch(input, { ...init, headers });
    };

    const user = await manager.getUser();
    const token = user?.access_token;
    const response = await send(token);
    if (response.status !== 401 || !token) return response;

    const refused = refusedTokens(manager);
    if (refused.has(token) && !user?.expired) return response;

    const renewed = (await renewAccessToken({ manager, rejectedToken: token }))?.access_token;
    if (!renewed || renewed === token) return response;

    const retried = await send(renewed);
    if (retried.status === 401) refused.add(renewed);
    return retried;
  };
}
