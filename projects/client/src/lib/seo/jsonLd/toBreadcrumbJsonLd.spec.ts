import { describe, expect, it } from 'vitest';
import { toBreadcrumbJsonLd } from './toBreadcrumbJsonLd.ts';

describe('seo: toBreadcrumbJsonLd', () => {
  it('should number the trail and link each step on the production origin', () => {
    expect(
      toBreadcrumbJsonLd([
        { name: 'Shows', path: '/shows/trending' },
        { name: 'Severance', path: '/shows/severance' },
      ]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Shows', item: 'https://og.trakt.tv/shows/trending' },
        { '@type': 'ListItem', position: 2, name: 'Severance', item: 'https://og.trakt.tv/shows/severance' },
      ],
    });
  });

  it("should leave the last step's link out when it has none, and show a page once", () => {
    const crumbs = toBreadcrumbJsonLd([
      { name: 'Season 1', path: '/shows/severance/seasons/1' },
      { name: 'Good News About Hell', path: '/shows/severance/seasons/1' },
      { name: 'Comments' },
    ]).itemListElement;

    expect(crumbs).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Season 1', item: 'https://og.trakt.tv/shows/severance/seasons/1' },
      { '@type': 'ListItem', position: 2, name: 'Comments' },
    ]);
  });
});
