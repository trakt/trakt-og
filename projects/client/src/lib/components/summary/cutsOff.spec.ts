import { describe, expect, it } from 'vitest';
import { cutsOff } from './cutsOff.ts';

describe('util: cutsOff', () => {
  it('should be false when the text fits', () => {
    expect(cutsOff({ scrollWidth: 120, clientWidth: 120, scrollHeight: 18, clientHeight: 18 })).toBe(false);
  });

  it('should be true when an ellipsized line runs wider than its box', () => {
    expect(cutsOff({ scrollWidth: 240, clientWidth: 120, scrollHeight: 18, clientHeight: 18 })).toBe(true);
  });

  it('should be true when clamped lines run taller than their box', () => {
    expect(cutsOff({ scrollWidth: 120, clientWidth: 120, scrollHeight: 72, clientHeight: 54 })).toBe(true);
  });
});
