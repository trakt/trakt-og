import { legacyRedirect } from '../../../lib/routing/legacyRedirect.ts';

/** OG's legacy `/movie/:id`. `/movies/:id` then redirects again if the id isn't the canonical slug. */
export function load({ params, url }) {
  legacyRedirect(301, ['movies', params.id], url);
}
