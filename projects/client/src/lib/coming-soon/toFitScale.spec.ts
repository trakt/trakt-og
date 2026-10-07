import { describe, expect, it } from 'vitest';
import { toFitScale } from './toFitScale.ts';

describe('toFitScale', () => {
  it('should shrink content taller than the space it has', () => {
    expect(toFitScale({ available: 900, natural: 1200 })).toBe(0.75);
  });

  it('should leave content that already fits at full size', () => {
    expect(toFitScale({ available: 900, natural: 600 })).toBe(1);
  });

  it('should leave content alone before it has been measured', () => {
    expect(toFitScale({ available: 900, natural: 0 })).toBe(1);
    expect(toFitScale({ available: 0, natural: 600 })).toBe(1);
  });
});
