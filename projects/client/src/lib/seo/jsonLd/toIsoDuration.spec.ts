import { describe, expect, it } from 'vitest';
import { toIsoDuration } from './toIsoDuration.ts';

describe('seo: toIsoDuration', () => {
  it('should write hours and minutes', () => {
    expect(toIsoDuration(148)).toBe('PT2H28M');
    expect(toIsoDuration(45)).toBe('PT45M');
    expect(toIsoDuration(120)).toBe('PT2H');
  });

  it('should be undefined without a runtime', () => {
    expect(toIsoDuration(0)).toBeUndefined();
    expect(toIsoDuration(undefined)).toBeUndefined();
  });
});
