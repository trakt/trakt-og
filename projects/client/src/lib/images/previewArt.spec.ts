import { describe, expect, it } from 'vitest';
import { previewArt } from './previewArt.ts';

describe('util: previewArt', () => {
  it('should name each art to try, in order, on og', () => {
    expect(previewArt({ type: 'season', id: 9, slot: 'poster' }, { type: 'show', id: 2, slot: 'fanart' })).toBe(
      'https://og.trakt.tv/api/art/season/9/poster/show/2/fanart',
    );
  });
});
