import { describe, expect, it } from 'vitest';
import { isUnknownDate } from './isUnknownDate.ts';

describe('util: isUnknownDate', () => {
  it('should spot the epoch however it is written', () => {
    expect(['1970-01-01T00:00:00.000Z', '1970-01-01T00:00:00Z'].map(isUnknownDate)).toEqual([true, true]);
  });

  it('should pass real dates', () => {
    expect(['2024-03-01T20:00:00.000Z', '1970-01-01T00:00:01Z'].map(isUnknownDate)).toEqual([false, false]);
  });
});
