import { describe, expect, it } from 'vitest';
import type { QualityData } from './QualityData.ts';
import type { QualityPoint } from './QualityPoint.ts';
import { toQualityHighlights } from './toQualityHighlights.ts';

const point = (number: number, percent: number | null, title?: string): QualityPoint => ({
  label: `Season ${number}`,
  axis: `S${number}`,
  name: `Season ${number}`,
  ...(title ? { title } : {}),
  href: `/shows/got/seasons/${number}/stats`,
  traktId: number,
  number,
  percent,
  votes: 100,
});

const seasons: QualityData = {
  unit: 'season',
  points: [point(1, 89), point(2, 88), point(3, 92), point(4, 71), point(5, 80)],
};

describe('util: toQualityHighlights', () => {
  it('should key the best and lowest seasons and the biggest drop, each in its own color', () => {
    expect(
      toQualityHighlights({ data: seasons }).map(({ name, share, counts, color }) => [name, share, counts, color]),
    ).toEqual([
      ['Best Season', '92%', [{ value: 'Season 3' }], 'var(--color-stats-diff-up)'],
      ['Lowest Season', '71%', [{ value: 'Season 4' }], 'var(--color-stats-diff-down)'],
      ['Biggest Drop', '−21', [{ value: 'Season 3 to Season 4' }], 'var(--color-stats-diff-flat)'],
    ]);
  });

  it('should name an episode with its title and skip a gap for the drop', () => {
    const episodes: QualityData = {
      unit: 'episode',
      points: [point(1, 80, 'Winterfell'), point(2, null), point(3, 65, 'The Bells')],
    };
    expect(toQualityHighlights({ data: episodes }).map(({ name, counts }) => [name, ...counts])).toEqual([
      ['Best Episode', { value: 'Season 1', text: 'Winterfell' }],
      ['Lowest Episode', { value: 'Season 3', text: 'The Bells' }],
      ['Biggest Drop', { value: 'Season 1 to Season 3' }],
    ]);
  });

  it('should leave out the drop when the line never falls', () => {
    const rising: QualityData = { unit: 'season', points: [point(1, 70), point(2, 80)] };
    expect(toQualityHighlights({ data: rising }).map(({ name }) => name)).toEqual(['Best Season', 'Lowest Season']);
  });

  it("should add the viewer's average against Trakt's on the same seasons", () => {
    const yours = toQualityHighlights({ data: seasons, you: [100, null, 80, null, null] }).at(-1);
    expect([yours?.name, yours?.share, yours?.counts]).toEqual([
      'Your Average',
      '90%',
      [{ value: 'Trakt 91%', text: 'on the same seasons' }],
    ]);
  });

  it('should have no keys under two rated points', () => {
    expect(toQualityHighlights({ data: { unit: 'season', points: [point(1, 80), point(2, null)] } })).toEqual([]);
  });
});
