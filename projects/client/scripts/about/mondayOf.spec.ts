import { describe, expect, it } from 'vitest';
import { mondayOf } from './mondayOf.ts';

describe('util: mondayOf', () => {
  it('should keep a Monday as its own week', () => {
    expect(mondayOf(new Date('2026-10-19T00:00:00Z'))).toBe('2026-10-19');
  });

  it('should file the rest of the week under its Monday', () => {
    expect(mondayOf(new Date('2026-10-22T15:30:00Z'))).toBe('2026-10-19');
    expect(mondayOf(new Date('2026-10-25T23:59:59Z'))).toBe('2026-10-19');
  });

  it('should count in UTC, not the commit time zone', () => {
    expect(mondayOf(new Date('2026-10-25T20:00:00-07:00'))).toBe('2026-10-26');
  });

  it('should cross month boundaries', () => {
    expect(mondayOf(new Date('2026-10-01T12:00:00Z'))).toBe('2026-09-28');
  });
});
