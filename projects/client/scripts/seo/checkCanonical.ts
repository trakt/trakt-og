import type { Check } from './Check.ts';
import type { SeoHtml } from './SeoHtml.ts';
import { SEO_EXPECTATIONS } from './seoExpectations.ts';

/** The page links exactly one canonical: `path` on og.trakt.tv, whatever host served it. */
export function checkCanonical(page: SeoHtml, path: string): Check {
  const expected = `${SEO_EXPECTATIONS.origin}${path}`;
  if (page.canonicals.length !== 1) {
    return { group: 'canon', label: 'one canonical', pass: false, detail: `found ${page.canonicals.length}` };
  }

  const value = page.canonicals.at(0) ?? '';
  return {
    group: 'canon',
    label: 'canonical URL',
    pass: value === expected,
    detail: `got "${value}", want "${expected}"`,
  };
}
