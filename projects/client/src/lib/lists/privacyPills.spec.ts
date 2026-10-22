import { describe, expect, it } from 'vitest';
import { privacyPills } from './privacyPills.ts';

describe('util: privacyPills', () => {
  it('should read private and link lists as Private', () => {
    expect(privacyPills('private')).toEqual(['Private']);
    expect(privacyPills('link')).toEqual(['Private']);
  });

  it('should read a friends-only list as Following', () => {
    expect(privacyPills('friends')).toEqual(['Following']);
  });

  it('should show nothing for a public list or a missing privacy', () => {
    expect(privacyPills('public')).toEqual([]);
    expect(privacyPills(null)).toEqual([]);
    expect(privacyPills(undefined)).toEqual([]);
  });
});
