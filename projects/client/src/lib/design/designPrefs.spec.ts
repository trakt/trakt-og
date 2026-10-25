import { describe, expect, it } from 'vitest';
import { designPrefs } from './designPrefs.ts';

describe('designPrefs', () => {
  it('should default to light with the nav open', () => {
    expect(designPrefs.read({ cookie: undefined, query: null })).toEqual({ theme: 'light', collapsed: false });
  });

  it('should round-trip a saved choice', () => {
    const cookie = designPrefs.serialize({ theme: 'dark', collapsed: true }).split(';').at(0)?.split('=').at(1);
    expect(designPrefs.read({ cookie, query: null })).toEqual({ theme: 'dark', collapsed: true });
  });

  it('should let the query pick the theme', () => {
    expect(designPrefs.read({ cookie: 'dark.open', query: 'light' }).theme).toBe('light');
  });

  it('should fall back to light for anything unknown', () => {
    expect(designPrefs.read({ cookie: 'sepia.sideways', query: null })).toEqual({ theme: 'light', collapsed: false });
  });
});
