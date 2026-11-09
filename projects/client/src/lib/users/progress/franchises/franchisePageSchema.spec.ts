import { describe, expect, it } from 'vitest';
import { franchisePageSchema } from './franchisePageSchema.ts';

const list = (slug: string, item_ids: unknown, id = 1) => ({
  like_count: 1,
  list: { name: slug.toUpperCase(), ids: { trakt: id, slug }, item_ids },
});

describe('franchisePageSchema', () => {
  it('should keep the franchises with their movie ids only', () => {
    const page = franchisePageSchema.parse([
      list('alien-collection', { movies: [10, 11, 10], shows: [5], seasons: [], episodes: [] }, 7),
      list('best-of-2020', { movies: [1, 2, 3] }, 8),
      list('lonely-collection', { movies: [1] }, 9),
      list('mixed-collection', { movies: [], shows: [1, 2, 3] }, 10),
    ]);

    expect(page).toEqual([
      { id: 7, slug: 'alien-collection', name: 'ALIEN-COLLECTION', movieIds: [10, 11], likeCount: 1 },
    ]);
  });

  it('should read a list without likes as having none', () => {
    const [franchise] = franchisePageSchema.parse([
      { list: { name: 'A', ids: { trakt: 1, slug: 'a-collection' }, item_ids: { movies: [1, 2] } } },
    ]);

    expect(franchise?.likeCount).toBe(0);
  });

  it('should skip a row that is malformed', () => {
    const page = franchisePageSchema.parse([{ list: null }, 'nope', list('alien-collection', { movies: [1, 2] })]);

    expect(page.map(({ slug }) => slug)).toEqual(['alien-collection']);
  });

  it('should read a list without item ids as having no movies', () => {
    expect(franchisePageSchema.parse([list('alien-collection', undefined)])).toEqual([]);
  });
});
