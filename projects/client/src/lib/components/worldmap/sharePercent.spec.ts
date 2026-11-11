import { describe, expect, it } from 'vitest';
import { sharePercent } from './sharePercent.ts';

describe('sharePercent', () => {
  it('should round to a whole percent', () => {
    expect([0.2242, 0.0354, 0.01, 1].map((share) => sharePercent(share))).toEqual(['22%', '4%', '1%', '100%']);
  });

  it('should keep one place when asked', () => {
    expect([0.2242, 0.0354, 0.01, 1].map((share) => sharePercent(share, 1))).toEqual([
      '22.4%',
      '3.5%',
      '1.0%',
      '100.0%',
    ]);
  });

  it('should floor anything under 1% at "<1%"', () => {
    expect([0.0003, 0.0099].map((share) => sharePercent(share, 1))).toEqual(['<1%', '<1%']);
  });
});
