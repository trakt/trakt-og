import { describe, expect, it } from 'vitest';
import { canSeeLive } from './canSeeLive.ts';

describe('canSeeLive', () => {
  it('should let a VIP in', () => {
    expect(canSeeLive({ isVip: true, isDirector: false })).toBe(true);
  });

  it('should let a director in', () => {
    expect(canSeeLive({ isVip: false, isDirector: true })).toBe(true);
  });

  it('should keep out a member without VIP, and a guest', () => {
    expect(canSeeLive({ isVip: false, isDirector: false })).toBe(false);
    expect(canSeeLive(null)).toBe(false);
  });
});
