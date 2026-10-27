import { describe, expect, it } from 'vitest';
import { toListSeo } from './toListSeo.ts';

const list = {
  name: 'Best of 2024',
  description: 'My favorites.',
  path: '/lists/official/best-of-2024',
  itemCount: 12,
};

describe('seo: toListSeo', () => {
  it('should title an official list by its name', () => {
    expect(toListSeo({ ...list, image: 'https://media.trakt.tv/a.jpg' })).toEqual({
      title: 'Best of 2024',
      description: 'My favorites.',
      image: 'https://media.trakt.tv/a.jpg',
      imageAlt: 'Best of 2024',
      jsonLd: [],
    });
  });

  it("should add a personal list's owner", () => {
    expect(toListSeo({ ...list, owner: 'Justin Nemeth' }).title).toBe('Best of 2024 by Justin Nemeth');
  });

  it('should count the items without a description', () => {
    expect(toListSeo({ ...list, description: undefined }).description).toBe('12 movies and shows.');
    expect(toListSeo({ ...list, description: '', itemCount: 1 }).description).toBe('1 movie or show.');
    expect(toListSeo({ ...list, description: null, itemCount: 1234 }).description).toBe('1,234 movies and shows.');
  });

  it('should leave the image to the default without items', () => {
    expect(toListSeo({ ...list, itemCount: 0 }).image).toBeUndefined();
  });

  it('should add an ItemList of the items it is given', () => {
    const seo = toListSeo({ ...list, owner: 'Justin', items: ['/movies/dune-part-two-2024'] });

    expect(seo.jsonLd).toMatchObject([
      {
        '@type': 'ItemList',
        name: 'Best of 2024 by Justin',
        numberOfItems: 12,
        itemListElement: [{ position: 1, url: 'https://og.trakt.tv/movies/dune-part-two-2024' }],
      },
    ]);
  });
});
