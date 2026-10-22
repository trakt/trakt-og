import { describe, expect, it } from 'vitest';
import { parameterize } from './parameterize.ts';

describe('util: parameterize', () => {
  it('should lower-case and hyphenate words', () => {
    expect(parameterize('Visual Effects')).toBe('visual-effects');
  });

  it('should collapse symbols and trim the ends', () => {
    expect(parameterize(' Costume & Make-Up! ')).toBe('costume-make-up');
  });
});
