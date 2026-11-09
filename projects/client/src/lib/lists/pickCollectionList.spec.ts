import { describe, expect, it } from 'vitest';
import { pickCollectionList } from './pickCollectionList.ts';

const list = (slug: string, item_count: number) => ({ ids: { trakt: item_count, slug }, item_count });

describe('pickCollectionList', () => {
  it('should pick the collection over a more popular chart list', () => {
    const lists = [
      list('imdb-popular-movies', 100),
      list('spider-man-mcu-collection', 4),
      list('trakt-popular-movies', 250),
    ];

    expect(pickCollectionList(lists)?.ids.slug).toBe('spider-man-mcu-collection');
  });

  it('should skip a large catalog that only shares the collection name', () => {
    const lists = [list('the-criterion-collection', 1234), list('the-dark-knight-collection', 3)];

    expect(pickCollectionList(lists)?.ids.slug).toBe('the-dark-knight-collection');
  });

  it('should pick the smallest collection when there are several', () => {
    const lists = [list('studio-ghibli-collection', 23), list('howls-moving-castle-collection', 2)];

    expect(pickCollectionList(lists)?.ids.slug).toBe('howls-moving-castle-collection');
  });

  it('should pick nothing when the title is only on chart and award lists', () => {
    const lists = [list('imdb-top-rated-movies', 250), list('the-criterion-collection', 1234)];

    expect(pickCollectionList(lists)).toBeUndefined();
  });
});
