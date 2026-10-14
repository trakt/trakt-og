import { describe, expect, it } from 'vitest';
import { scrollsBelow } from './scrollsBelow.ts';

describe('util: scrollsBelow', () => {
  it('should be false when everything fits', () => {
    expect(scrollsBelow({ scrollTop: 0, clientHeight: 200, scrollHeight: 200 })).toBe(false);
  });

  it('should be true when more sits below', () => {
    expect(scrollsBelow({ scrollTop: 0, clientHeight: 200, scrollHeight: 320 })).toBe(true);
  });

  it('should be false once scrolled to the end', () => {
    expect(scrollsBelow({ scrollTop: 120, clientHeight: 200, scrollHeight: 320 })).toBe(false);
  });

  it('should treat a rounded last pixel as the end', () => {
    expect(scrollsBelow({ scrollTop: 119.5, clientHeight: 200, scrollHeight: 320 })).toBe(false);
  });
});
