import type { Check } from './Check.ts';
import type { PageResponse } from './PageResponse.ts';
import { parseSeoHtml } from './parseSeoHtml.ts';

/** A made-up item answers a real 404 (no soft 404), with one title and a noindex robots tag. */
export function checkMissing(response: PageResponse): readonly Check[] {
  const status: Check = {
    group: '404',
    label: 'made-up item answers 404',
    pass: response.status === 404,
    detail: `got ${response.status}`,
  };
  if (!status.pass) return [status];

  const page = parseSeoHtml(response.body);
  const robots = page.meta.get('robots') ?? [];
  return [
    status,
    {
      group: '404',
      label: '404 page has one <title>',
      pass: page.titles.length === 1,
      detail: `found ${page.titles.length}`,
    },
    {
      group: '404',
      label: '404 page is noindex',
      pass: robots.length === 1 && /\bnoindex\b/i.test(robots.at(0) ?? ''),
      detail: `robots tags: ${robots.map((value) => `"${value}"`).join(', ') || 'none'}`,
    },
  ];
}
