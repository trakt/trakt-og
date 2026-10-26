import { describe, expect, it } from 'vitest';
import { compactCount } from './compactCount.ts';

describe('util: compactCount', () => {
  it('should keep counts under a thousand whole', () => {
    expect(compactCount(950)).toBe('950');
  });

  it('should shorten thousands and millions to one decimal at most', () => {
    expect([12_702, 219_022, 1_240_000].map(compactCount)).toEqual(['12.7K', '219K', '1.2M']);
  });
});
