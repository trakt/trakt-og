import { describe, expect, it } from 'vitest';
import { canSeePortraits } from './canSeePortraits.ts';

describe('util: canSeePortraits', () => {
  it('should show portraits to directors only', () => {
    expect(canSeePortraits({ isDirector: true })).toBe(true);
    expect(canSeePortraits({ isDirector: false })).toBe(false);
    expect(canSeePortraits(null)).toBe(false);
  });
});
