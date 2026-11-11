import { describe, expect, it } from 'vitest';
import { countryFlag } from './countryFlag.ts';

describe('countryFlag', () => {
  it("should point at a country's flag, and at none for a code without one", () => {
    expect(countryFlag('BR')).toBe('/flags/br.svg');
    expect(countryFlag('XX')).toBeUndefined();
  });
});
