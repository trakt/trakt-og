import { describe, expect, it } from 'vitest';
import { capitalize } from './capitalize.ts';

describe('util: capitalize', () => {
  it('should upper-case only the first letter', () => {
    expect(capitalize('returning series')).toBe('Returning series');
  });

  it('should leave an empty string empty', () => {
    expect(capitalize('')).toBe('');
  });
});
