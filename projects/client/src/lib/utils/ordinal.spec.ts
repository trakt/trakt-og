import { describe, expect, it } from 'vitest';
import { ordinal } from './ordinal.ts';

describe('util: ordinal', () => {
  it('should add st, nd and rd after 1, 2 and 3', () => {
    expect([1, 2, 3, 21, 32, 43, 101].map(ordinal)).toEqual(['1st', '2nd', '3rd', '21st', '32nd', '43rd', '101st']);
  });

  it('should add th to the teens and everything else', () => {
    expect([4, 11, 12, 13, 70, 111, 112].map(ordinal)).toEqual([
      '4th',
      '11th',
      '12th',
      '13th',
      '70th',
      '111th',
      '112th',
    ]);
  });
});
