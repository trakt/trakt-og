import { describe, expect, it } from 'vitest';
import { filterTagLabel } from '../../components/filters/filterTagLabel.ts';
import { smartListRecipe } from './smartListRecipe.ts';

const labelled = (filters: Parameters<typeof smartListRecipe>[0]['filters']) =>
  smartListRecipe({ filters, country: 'us' }).map((tag) => [
    filterTagLabel(tag.id),
    tag.values.map(({ text, without }) => (without ? `-${text}` : text)).join(', '),
  ]);

describe('util: smartListRecipe', () => {
  it("should read a chart list's filters like the chart's Applied Filters", () => {
    expect(labelled({ genres: ['drama', '-animation'], ratings: [75, 100] })).toEqual([
      ['Genres', 'Drama, -Animation'],
      ['Trakt', '75 - 100%'],
    ]);
  });

  it('should list the filters only a smart list has, one chip each, and the hide switches on one', () => {
    expect(
      labelled({
        keywords: ['time-travel', '-superhero'],
        keywords_operator: 'or',
        studios: ['a24'],
        metascores: [80, 100],
        released_within_days: 120,
        ignore_watched: true,
        ignore_watchlisted: true,
        ignore_ended: false,
      }),
    ).toEqual([
      ['Keywords', 'Time Travel, -Superhero'],
      ['Studios', 'A24'],
      ['Metascore', '80 - 100'],
      ['Released', 'Last 120 days'],
      ['Hide', 'Watched, Watchlisted'],
    ]);
  });

  it('should give nothing for an unfiltered list', () => {
    expect(smartListRecipe({ filters: {}, country: 'us' })).toEqual([]);
  });
});
