import { describe, expect, it } from 'vitest';
import { toProfileRatings } from './toProfileRatings.ts';

// 937 ratings averaging 8.50, most of them 10s.
const distribution = { '1': 22, '2': 1, '3': 5, '4': 1, '5': 32, '6': 38, '7': 130, '8': 154, '9': 149, '10': 405 };
const types = { movies: 498, shows: 141, seasons: 0, episodes: 298 };

const tallestOf = (counts: Record<string, number>) => toProfileRatings({ distribution: counts }).chart;

describe('mapper: toProfileRatings', () => {
  it('should total the ratings and average them to two places', () => {
    const ratings = toProfileRatings({ distribution, types });

    expect(ratings.count).toBe('937');
    expect(ratings.average).toBe('8.50');
  });

  it('should draw ten bars named by their rating, each with its share of all ratings', () => {
    const bars = toProfileRatings({ distribution }).chart?.bars ?? [];

    expect(bars.map(({ rating }) => rating)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(bars.at(7)).toMatchObject({ count: 154, name: 'Great', share: '16%' });
    expect(bars.at(0)).toMatchObject({ count: 22, name: 'Weak Sauce :(', share: '2.3%' });
  });

  describe('for the scale', () => {
    it('should step the count lines in hundreds with room over the tallest bar', () => {
      const chart = tallestOf(distribution);

      // 405 plus 15% is 466, so five lines of 100 up to 500.
      expect(chart?.levels.map(({ label }) => label)).toEqual(['100', '200', '300', '400', '500']);
      expect(chart?.levels.at(-1)?.height).toBe(100);
      expect(chart?.bars.at(9)?.height).toBeCloseTo(81);
    });

    it('should use steps of 2.5 and 5 and label thousands with separators', () => {
      expect(tallestOf({ '8': 100 })?.levels.map(({ label }) => label)).toEqual(['25', '50', '75', '100', '125']);
      expect(tallestOf({ '8': 2_000 })?.levels.map(({ label }) => label)).toEqual([
        '500',
        '1,000',
        '1,500',
        '2,000',
        '2,500',
      ]);
    });

    it('should keep the steps whole for a handful of ratings', () => {
      expect(tallestOf({ '8': 1 })?.levels.map(({ label }) => label)).toEqual(['1', '2']);
      expect(tallestOf({ '8': 4 })?.levels.map(({ label }) => label)).toEqual(['1', '2', '3', '4', '5']);
      expect(tallestOf({ '8': 7 })?.levels.map(({ label }) => label)).toEqual(['2', '4', '6', '8', '10']);
    });
  });

  describe('for the average line', () => {
    it('should sit at the average along the ratings, labelled after it', () => {
      const average = tallestOf(distribution)?.average;

      expect(average).toMatchObject({ label: '8.50 average', labelBefore: false });
      expect(average?.at).toBeCloseTo(80, 1);
    });

    it('should label it before the line past an average of 9', () => {
      const average = tallestOf({ '9': 1, '10': 3 })?.average;

      expect(average).toMatchObject({ label: '9.75 average', labelBefore: true });
      expect(average?.at).toBeCloseTo(92.5);
    });
  });

  describe('for the keys', () => {
    it('should give the total with its types, the average, the most given and the loved share', () => {
      const { keys } = toProfileRatings({ distribution, types });

      expect(keys).toEqual([
        { name: 'Ratings', share: '937', counts: ['498 movies', '141 shows', '298 episodes'] },
        { name: 'Average', share: '8.50', counts: ['hearts out of 10'] },
        { name: 'Most given', rating: 10, share: '10', counts: ['Totally Ninja!', '405 ratings'] },
        { name: 'Loved · 9 and 10', rating: 10, share: '59%', counts: ['554 ratings'] },
      ]);
    });

    it('should list rated seasons only when there are some, and no types without them', () => {
      expect(toProfileRatings({ distribution, types: { ...types, seasons: 1 } }).keys.at(0)?.counts)
        .toEqual(['498 movies', '141 shows', '1 season', '298 episodes']);
      expect(toProfileRatings({ distribution }).keys.at(0)?.counts).toEqual([]);
    });

    it('should pick the highest rating on a tie for most given and pick out only its bar', () => {
      const { chart, keys } = toProfileRatings({ distribution: { '6': 3, '7': 3, '2': 1 } });

      expect(keys.at(2)).toMatchObject({ share: '7', counts: ['Good', '3 ratings'] });
      expect(chart?.bars.filter(({ top }) => top).map(({ rating }) => rating)).toEqual([7]);
    });

    it('should show a tiny loved share under a tenth of a percent, and none as 0%', () => {
      expect(toProfileRatings({ distribution: { '5': 2_000, '9': 1 } }).keys.at(3)?.share).toBe('<0.1%');
      expect(toProfileRatings({ distribution: { '5': 2 } }).keys.at(3)).toMatchObject({
        share: '0%',
        counts: ['0 ratings'],
      });
    });
  });

  it('should keep empty ratings as bars with no height and a 0% share', () => {
    const bar = tallestOf({ '8': 10 })?.bars.at(1);

    expect(bar).toMatchObject({ rating: 2, count: 0, height: 0, share: '0%', top: false });
  });

  it('should leave the chart and keys out when there are no ratings', () => {
    expect(toProfileRatings({ distribution: undefined, types })).toEqual({
      count: '0',
      average: '0',
      chart: null,
      keys: [],
    });
    expect(toProfileRatings({ distribution: { '3': 0 } }).chart).toBeNull();
  });
});
