import { describe, expect, it } from 'vitest';
import { formatCount } from './formatCount.ts';

describe('util: formatCount', () => {
  it('should group thousands like toLocaleString', () => {
    expect([0, 12, 1234, 1_234_567, -5000, 12.5].map(formatCount)).toEqual(
      [0, 12, 1234, 1_234_567, -5000, 12.5].map((n) => n.toLocaleString('en-US')),
    );
  });
});
