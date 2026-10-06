import { describe, expect, it } from 'vitest';
import { reactionSummary } from './reactionSummary.ts';

const like = { type: 'like', emoji: '👍', label: 'Like' };
const laugh = { type: 'laugh', emoji: '😂', label: 'Laugh' };
const shocked = { type: 'shocked', emoji: '😱', label: 'Shocked' };

describe('util: reactionSummary', () => {
  it('should hide the summary when there are no reactions', () => {
    expect(reactionSummary(undefined)).toBeUndefined();
    expect(reactionSummary({ reaction_count: 0, user_count: 0, distribution: { like: 0 } })).toBeUndefined();
  });

  it('should show the kinds that have any, most first', () => {
    const summary = reactionSummary({
      reaction_count: 7,
      user_count: 7,
      distribution: { shocked: 1, like: 2, laugh: 4 },
    });

    expect(summary?.top).toEqual([
      { ...laugh, count: 4, text: '4', name: '4 Laugh reactions' },
      { ...like, count: 2, text: '2', name: '2 Like reactions' },
      { ...shocked, count: 1, text: '1', name: '1 Shocked reaction' },
    ]);
    expect(summary?.more).toBe(0);
    expect(summary?.total).toBe('7 reactions');
  });

  it("should keep OG's order between kinds with the same count", () => {
    const summary = reactionSummary({
      reaction_count: 4,
      user_count: 4,
      distribution: { spoiler: 1, bravo: 1, laugh: 1, dislike: 1 },
    });

    expect(summary?.top.map(({ type }) => type)).toEqual(['dislike', 'laugh', 'bravo']);
  });

  it('should show only the top three and count the rest behind +N', () => {
    const summary = reactionSummary({
      reaction_count: 300,
      user_count: 300,
      distribution: { like: 200, dislike: 3, love: 50, laugh: 30, shocked: 10, bravo: 5, spoiler: 2 },
    });

    expect(summary?.top.map(({ type }) => type)).toEqual(['like', 'love', 'laugh']);
    expect(summary?.more).toBe(4);
  });

  it("should list every kind in OG's order for the breakdown, with no number for a zero", () => {
    const summary = reactionSummary({
      reaction_count: 1502,
      user_count: 1502,
      distribution: { spoiler: 2, like: 1500 },
    });

    expect(summary?.all.map(({ type, text }) => [type, text])).toEqual([
      ['like', '1.5k'],
      ['dislike', ''],
      ['love', ''],
      ['laugh', ''],
      ['shocked', ''],
      ['bravo', ''],
      ['spoiler', '2'],
    ]);
    expect(summary?.all[0]?.name).toBe('1,500 Like reactions');
    expect(summary?.total).toBe('1,502 reactions');
  });
});
