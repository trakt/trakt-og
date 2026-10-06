import { describe, expect, it } from 'vitest';
import { reactionSummary } from './reactionSummary.ts';

describe('util: reactionSummary', () => {
  it('should hide the summary when there are no reactions', () => {
    expect(reactionSummary(undefined)).toBeUndefined();
    expect(reactionSummary({ reaction_count: 0, user_count: 0, distribution: { like: 0 } })).toBeUndefined();
  });

  it("should give each reaction type that has any its own count, in OG's order", () => {
    expect(
      reactionSummary({
        reaction_count: 7,
        user_count: 7,
        distribution: { shocked: 1, like: 4, love: 0, dislike: 0, laugh: 2, bravo: 0, spoiler: 0 },
      }),
    ).toEqual({
      reactions: [
        { type: 'like', emoji: '👍', count: '4', label: '4 Like reactions' },
        { type: 'laugh', emoji: '😂', count: '2', label: '2 Laugh reactions' },
        { type: 'shocked', emoji: '😱', count: '1', label: '1 Shocked reaction' },
      ],
      total: '7 reactions',
    });
  });

  it('should shorten big counts on screen and spell them out for screen readers', () => {
    expect(
      reactionSummary({
        reaction_count: 1502,
        user_count: 1502,
        distribution: { spoiler: 2, like: 1500 },
      }),
    ).toEqual({
      reactions: [
        { type: 'like', emoji: '👍', count: '1.5k', label: '1,500 Like reactions' },
        { type: 'spoiler', emoji: '🫣', count: '2', label: '2 Spoiler reactions' },
      ],
      total: '1,502 reactions',
    });
  });
});
