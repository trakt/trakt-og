import { legacyRedirect } from '../../../lib/routing/legacyRedirect.ts';

/** OG's legacy `/show/:id`. `/shows/:id` then redirects again if the id isn't the canonical slug. */
export function load({ params, url }) {
  legacyRedirect(301, ['shows', params.id], url);
}
