import { legacyRedirect } from '../../../../../lib/routing/legacyRedirect.ts';

/** OG's deprecated `/users/:id/recommendations(/:type)` rendered favorites. */
export function GET({ params, url }) {
  legacyRedirect(301, ['users', params.id, 'favorites'], url);
}
