import { legacyRedirect } from '../../../lib/routing/legacyRedirect.ts';

/** OG's `/user/:id` alias for `/users/:id`. */
export function GET({ params, url }) {
  legacyRedirect(301, ['users', ...params.path.split('/')], url);
}
