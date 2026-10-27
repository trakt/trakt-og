import { describe, expect, it } from 'vitest';
import { toLastmod } from './toLastmod.ts';

describe('util: toLastmod', () => {
  it("should keep the API's updated_at to the second, in UTC", () => {
    expect(toLastmod('2026-10-26T08:05:55.000Z')).toBe('2026-10-26T08:05:55Z');
    expect(toLastmod('2026-10-26T10:05:55+02:00')).toBe('2026-10-26T08:05:55Z');
  });

  it('should give no date when the API sent none or one that does not parse', () => {
    expect(toLastmod(undefined)).toBeUndefined();
    expect(toLastmod(null)).toBeUndefined();
    expect(toLastmod('')).toBeUndefined();
    expect(toLastmod('not a date')).toBeUndefined();
  });
});
