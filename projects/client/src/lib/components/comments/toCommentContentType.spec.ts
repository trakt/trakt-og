import { describe, expect, it } from 'vitest';
import { toCommentContentType } from './toCommentContentType.ts';

describe('toCommentContentType', () => {
  it.each([
    ['Loved every minute of it', false, 'text'],
    ['', false, 'text'],
    ['', true, 'gif'],
    ['   ', true, 'gif'],
    ['Loved every minute of it', true, 'text-and-gif'],
  ] as const)('should give %j with a GIF %s the %s type', (text, hasGif, type) => {
    expect(toCommentContentType(text, hasGif)).toBe(type);
  });
});
