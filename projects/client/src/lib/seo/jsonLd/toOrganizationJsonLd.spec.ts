import { describe, expect, it } from 'vitest';
import { toOrganizationJsonLd } from './toOrganizationJsonLd.ts';

describe('seo: toOrganizationJsonLd', () => {
  it('should name og with the classic red mark and the accounts the footer links', () => {
    expect(toOrganizationJsonLd()).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://og.trakt.tv/#organization',
      name: 'Trakt OG Redux',
      url: 'https://og.trakt.tv/',
      logo: 'https://og.trakt.tv/apple-touch-icon.png',
      sameAs: [
        'https://www.reddit.com/r/trakt',
        'https://ruby.social/@trakt',
        'https://twitter.com/trakt',
        'https://www.youtube.com/@trakt-tv',
        'https://github.com/trakt/trakt-og',
      ],
    });
  });
});
