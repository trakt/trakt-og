import { describe, expect, it } from 'vitest';
import { positiveInt } from './positiveInt.ts';

describe('util: positiveInt', () => {
  it('should read a whole number above zero', () => {
    expect(positiveInt('3', 1)).toBe(3);
    expect(positiveInt('12abc', 1)).toBe(12);
    expect(positiveInt('2.9', 1)).toBe(2);
  });

  it('should fall back when the value is missing, zero, negative or not a number', () => {
    expect([null, '', '0', '-4', 'abc'].map((value) => positiveInt(value, 7))).toEqual([7, 7, 7, 7, 7]);
  });
});
