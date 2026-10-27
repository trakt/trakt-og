import { describe, expect, it } from 'vitest';
import { toSeoTitle } from './toSeoTitle.ts';

describe('seo: toSeoTitle', () => {
  it('should put the site name after the page title', () => {
    expect(toSeoTitle('Inception (2010)')).toBe('Inception (2010) - Trakt OG Redux');
  });

  it('should be the site name alone without a page title', () => {
    expect(toSeoTitle(undefined)).toBe('Trakt OG Redux');
    expect(toSeoTitle('  ')).toBe('Trakt OG Redux');
  });
});
