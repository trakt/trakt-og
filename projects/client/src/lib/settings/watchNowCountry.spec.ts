import { describe, expect, it } from 'vitest';
import { watchNowCountry } from './watchNowCountry.ts';

describe('settings: watchNowCountry', () => {
  it('should lowercase the saved country', () => {
    expect(watchNowCountry({ browsing: { watchnow: { country: 'GB' } } })).toBe('gb');
  });

  it('should default to us without a country', () => {
    expect(
      [null, undefined, {}, { browsing: null }, { browsing: { watchnow: { country: '' } } }].map(watchNowCountry),
    ).toEqual(['us', 'us', 'us', 'us', 'us']);
  });
});
