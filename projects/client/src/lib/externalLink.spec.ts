import { describe, expect, it } from 'vitest';
import { externalLink } from './externalLink.ts';
import { traktUrls } from './traktUrls.ts';

describe('util: externalLink', () => {
  it('should open a v3 page in a new tab', () => {
    expect(externalLink(traktUrls.vip)).toEqual({ target: '_blank', rel: 'noopener' });
  });

  it('should keep an og route in the same tab', () => {
    expect(externalLink('/users/sean/progress?list=7')).toEqual({});
  });
});
