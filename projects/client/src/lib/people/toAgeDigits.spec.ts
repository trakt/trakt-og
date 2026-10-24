import { describe, expect, it } from 'vitest';
import { toAgeDigits } from './toAgeDigits.ts';

describe('toAgeDigits', () => {
  it('should pair each digit with the one it was', () => {
    expect(toAgeDigits(66, 67)).toEqual([
      { from: '6', to: '6' },
      { from: '6', to: '7' },
    ]);
    expect(toAgeDigits(69, 70)).toEqual([
      { from: '6', to: '7' },
      { from: '9', to: '0' },
    ]);
  });

  it('should roll a new place in from empty', () => {
    expect(toAgeDigits(99, 100)).toEqual([
      { from: '', to: '1' },
      { from: '9', to: '0' },
      { from: '9', to: '0' },
    ]);
  });
});
