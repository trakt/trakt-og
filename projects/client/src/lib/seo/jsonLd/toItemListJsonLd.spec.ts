import { describe, expect, it } from 'vitest';
import { toItemListJsonLd } from './toItemListJsonLd.ts';

describe('seo: toItemListJsonLd', () => {
  it('should list the first page by position and count the whole list', () => {
    expect(
      toItemListJsonLd({
        name: 'Best of 2024',
        description: 'My favorites.',
        path: '/users/justin/lists/best-of-2024',
        itemCount: 120,
        items: ['/movies/dune-part-two-2024', '/shows/shogun-2024'],
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Best of 2024',
      description: 'My favorites.',
      url: 'https://og.trakt.tv/users/justin/lists/best-of-2024',
      numberOfItems: 120,
      itemListElement: [
        { '@type': 'ListItem', position: 1, url: 'https://og.trakt.tv/movies/dune-part-two-2024' },
        { '@type': 'ListItem', position: 2, url: 'https://og.trakt.tv/shows/shogun-2024' },
      ],
    });
  });

  it('should drop an empty description and item list', () => {
    const data = toItemListJsonLd({
      name: 'Empty',
      description: null,
      path: '/lists/official/x',
      itemCount: 0,
      items: [],
    });

    expect(data).not.toHaveProperty('description');
    expect(data).not.toHaveProperty('itemListElement');
  });
});
