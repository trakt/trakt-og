import { describe, expect, it } from 'vitest';
import { formatWait, retryDelaySeconds } from './retryDelaySeconds.ts';

describe('retryDelaySeconds', () => {
  it('should wait 30 seconds after the first failure and double after each one', () => {
    expect([1, 2, 3, 4].map(retryDelaySeconds)).toEqual([30, 60, 120, 240]);
  });

  it('should never wait longer than 5 minutes', () => {
    expect(retryDelaySeconds(5)).toBe(300);
    expect(retryDelaySeconds(20)).toBe(300);
  });
});

describe('formatWait', () => {
  it('should count seconds under a minute and minutes with seconds from there', () => {
    expect(formatWait(45)).toBe('45s');
    expect(formatWait(60)).toBe('1:00');
    expect(formatWait(185)).toBe('3:05');
  });
});
