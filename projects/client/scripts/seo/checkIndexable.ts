import type { Check } from './Check.ts';
import type { PageResponse } from './PageResponse.ts';
import { parseSeoHtml } from './parseSeoHtml.ts';
import { SEO_EXPECTATIONS } from './seoExpectations.ts';

/** A URL listed in a sitemap answers 200 and doesn't ask to stay out of the index. */
export function checkIndexable(url: string, response: PageResponse): Check {
  const { pathname } = new URL(url);
  const known = SEO_EXPECTATIONS.knownIssues[pathname];
  const label = `${pathname} indexable`;
  if (response.status !== 200) return { group: 'urls', label, pass: false, detail: `got ${response.status}`, known };

  const robots = parseSeoHtml(response.body).meta.get('robots') ?? [];
  const noindex = robots.some((value) => /\bnoindex\b/i.test(value));
  return {
    group: 'urls',
    label,
    pass: robots.length === 1 && !noindex,
    detail: `robots tags: ${robots.join(' | ') || 'none'}`,
    known,
  };
}
