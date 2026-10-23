import { legacyRedirect } from '../../../../../lib/routing/legacyRedirect.ts';

/** OG's deprecated `/users/:id/collection(/...)` rendered the library. */
export function GET({ params, url }) {
  legacyRedirect(302, ['users', params.id, 'library', ...(params.rest ? params.rest.split('/') : [])], url);
}
