import { describe, expect, it } from 'vitest';
import { totalGross } from './totalGross.ts';

describe('util: totalGross', () => {
  it('should read the gross out of the import notes', () => {
    expect(totalGross('Weekend: $33.0m\nGross: $245.3m\nWeeks: 3')).toBe(245_300_000);
  });

  it('should scale each unit the readable stat writes', () => {
    expect(totalGross('Gross: $1.2b')).toBe(1_200_000_000);
    expect(totalGross('Gross: $512k')).toBe(512_000);
    expect(totalGross('Gross: $950')).toBe(950);
  });

  it('should be null when the notes have no gross', () => {
    expect(totalGross('Weekend: $33.0m')).toBeNull();
    expect(totalGross('')).toBeNull();
    expect(totalGross(null)).toBeNull();
    expect(totalGross(undefined)).toBeNull();
  });
});
