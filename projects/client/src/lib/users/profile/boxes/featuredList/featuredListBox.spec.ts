import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { featuredListBox } from './featuredListBox.ts';

const { lena, sam } = boxPersonas;

describe('featuredListBox', () => {
  it('should show the watchlist with its size, three posters and the next titles', async () => {
    const { score, entry } = await featuredListBox.evaluate(lena.input, lena.extras());
    expect(score).toBe(50);
    expect(entry?.view).toMatchObject({
      name: 'Watchlist',
      href: '/users/lena/watchlist',
      count: '212 items',
      image: 'https://media.trakt.tv/images/shows/000/206/790/fanarts/thumb/27e7ef3b00.jpg.webp',
      next: 'Next up: Pluribus, The Pitt, Sicario',
    });
    expect(entry?.view.posters).toHaveLength(3);
  });

  it('should score a short watchlist low', async () => {
    expect((await featuredListBox.evaluate(sam.input, sam.extras())).score).toBe(22);
  });

  it('should show the empty state for an empty watchlist', async () => {
    const input = { ...sam.input, watchlist: { count: 0, rows: [] } };
    expect(await featuredListBox.evaluate(input, sam.extras())).toMatchObject({
      score: null,
      entry: { view: { count: null, posters: [], next: null } },
    });
  });
});
