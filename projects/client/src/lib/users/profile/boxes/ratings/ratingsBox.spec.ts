import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { ratingsBox } from './ratingsBox.ts';

const { dex, sam } = boxPersonas;

describe('ratingsBox', () => {
  it('should show the average, the spread and the latest 10', async () => {
    const { score, entry } = await ratingsBox.evaluate(dex.input, dex.extras());
    expect(score).toBe(93);
    expect(entry?.view).toMatchObject({
      total: '2,310 Ratings',
      average: '7.2',
      averageAt: expect.closeTo(67, 0),
      chartLabel: 'Ratings from 1 to 10, most often 8, averaging 7.2.',
      latestTen: { text: 'The Thing', href: '/movies/the-thing-1982' },
    });
    expect(entry?.view.bars.at(7)).toEqual({
      height: 100,
      mode: true,
      tip: { count: '610', noun: 'ratings', share: '26% of all ratings' },
    });
  });

  it('should pick the highest rating on a tie as the one most often given', async () => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 20, 7: 20, 8: 0, 9: 0, 10: 0 };
    const input = { ...dex.input, stats: { ...dex.input.stats, ratings: { total: 40, distribution } } };
    const { entry } = await ratingsBox.evaluate(input, dex.extras());
    expect(entry?.view.chartLabel).toBe('Ratings from 1 to 10, most often 7, averaging 6.5.');
    expect(entry?.view.bars.flatMap(({ mode }, i) => (mode ? [i + 1] : []))).toEqual([7]);
  });

  it('should work without the latest 10', async () => {
    const { entry } = await ratingsBox.evaluate(dex.input, () => Promise.resolve(undefined));
    expect(entry?.view.latestTen).toBeNull();
  });

  it('should need 25 ratings', async () => {
    expect(await ratingsBox.evaluate(sam.input, sam.extras())).toMatchObject({ score: null, entry: null });
  });
});
