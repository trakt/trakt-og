import { describe, expect, it } from 'vitest';
import { reactionPickLabel } from './reactionPickLabel.ts';

const like = { type: 'like', label: 'Like', count: 1234 } as const;

describe('util: reactionPickLabel', () => {
  it('should offer to add a reaction when the viewer has none', () => {
    expect(reactionPickLabel(like)).toBe('Like (1,234), add your reaction');
  });

  it('should offer to remove the viewer’s own reaction', () => {
    expect(reactionPickLabel(like, 'like')).toBe('Like (1,234), remove your reaction');
  });

  it('should offer to switch when the viewer picked another kind', () => {
    expect(reactionPickLabel(like, 'laugh')).toBe('Like (1,234), switch your reaction');
  });
});
