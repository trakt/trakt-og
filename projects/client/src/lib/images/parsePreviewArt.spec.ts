import { describe, expect, it } from 'vitest';
import { parsePreviewArt } from './parsePreviewArt.ts';

describe('util: parsePreviewArt', () => {
  it('should read each art to try, in order', () => {
    expect(parsePreviewArt('season/9/poster/show/2/fanart')).toEqual([
      { type: 'season', id: 9, slot: 'poster' },
      { type: 'show', id: 2, slot: 'fanart' },
    ]);
  });

  it('should refuse anything else', () => {
    expect(parsePreviewArt('')).toBeNull();
    expect(parsePreviewArt('show/2')).toBeNull();
    expect(parsePreviewArt('user/2/avatar')).toBeNull();
    expect(parsePreviewArt('show/x/fanart')).toBeNull();
    expect(parsePreviewArt('show/2/logo')).toBeNull();
    expect(parsePreviewArt('show/1/fanart/show/2/fanart/show/3/fanart/show/4/fanart')).toBeNull();
  });
});
