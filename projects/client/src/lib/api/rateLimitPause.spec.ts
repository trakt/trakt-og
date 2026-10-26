import { afterEach, describe, expect, it } from 'vitest';
import { rateLimitPause } from './rateLimitPause.ts';

afterEach(() => rateLimitPause.start('0', 0));

describe('rateLimitPause', () => {
  it('should hold for Retry-After, counting down in whole seconds', () => {
    rateLimitPause.start('90', 1_000);

    expect(rateLimitPause.remaining(1_000)).toBe(90);
    expect(rateLimitPause.remaining(60_500)).toBe(31);
    expect(rateLimitPause.remaining(91_000)).toBe(0);
  });

  it('should hold a minute without a usable Retry-After', () => {
    rateLimitPause.start(null, 0);

    expect(rateLimitPause.remaining(0)).toBe(60);
  });
});
