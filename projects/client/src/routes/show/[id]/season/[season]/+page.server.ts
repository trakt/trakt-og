import { legacyRedirect } from '../../../../../lib/routing/legacyRedirect.ts';

export function load({ params, url }) {
  legacyRedirect(301, ['shows', params.id, 'seasons', params.season], url);
}
