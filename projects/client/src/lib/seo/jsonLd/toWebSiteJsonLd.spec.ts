import { describe, expect, it } from 'vitest';
import { toWebSiteJsonLd } from './toWebSiteJsonLd.ts';

describe('seo: toWebSiteJsonLd', () => {
  it('should publish the site under the organization, with no search action', () => {
    const data = toWebSiteJsonLd();

    expect(data).toMatchObject({
      '@type': 'WebSite',
      name: 'Trakt OG Redux',
      url: 'https://og.trakt.tv/',
      publisher: { '@id': 'https://og.trakt.tv/#organization' },
    });
    expect(data).not.toHaveProperty('potentialAction');
  });
});
