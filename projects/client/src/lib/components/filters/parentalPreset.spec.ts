import { describe, expect, it } from 'vitest';
import { parentalPreset, parentalPresets } from './parentalPreset.ts';

describe('util: parentalPreset', () => {
  it('should name each preset from its own limits', () => {
    expect(parentalPreset({})).toBe('any');
    expect(parentalPreset(parentalPresets.kids)).toBe('kids');
    expect(parentalPreset(parentalPresets.teens)).toBe('teens');
  });

  it('should count a Severe limit as set, since it leaves out unrated titles', () => {
    expect(parentalPreset({ violence: 3 })).toBeUndefined();
  });

  it('should be Custom for any other mix', () => {
    expect(parentalPreset({ ...parentalPresets.kids, violence: 0 })).toBeUndefined();
    expect(parentalPreset({ nudity: 0 })).toBeUndefined();
  });
});
