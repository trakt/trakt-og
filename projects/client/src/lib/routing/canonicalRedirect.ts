import { redirect } from '@sveltejs/kit';

type CanonicalRedirectParams = {
  /** The path as the request spelled its optional segments. */
  requested: string;
  /** The same path as the page's own links spell it. */
  canonical: string;
  url: URL;
};

/**
 * Optional segments with a fixed set of values (OG's sorts and types) have one spelling. A made-up value, a cut OG
 * value or a spelled-out default 301s to it with the query kept, so a crawler never indexes a copy of the page under a
 * URL its links don't use.
 */
export function canonicalRedirect({ requested, canonical, url }: CanonicalRedirectParams): void {
  if (requested !== canonical) redirect(301, `${canonical}${url.search}`);
}
