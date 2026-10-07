import { describe, expect, it } from 'vitest';
import { DISCOVER_THEMES } from './discoverThemes.ts';
import { themeFor } from './themeFor.ts';

const days = (year: number) =>
  Array.from({ length: 366 }, (_, index) => new Date(Date.UTC(year, 0, 1 + index)).toISOString().slice(0, 10))
    .filter((day) => day.startsWith(String(year)));

describe('themeFor', () => {
  it('should give every day of a leap year a theme', () => {
    expect(days(2028).filter((day) => !themeFor(DISCOVER_THEMES, day))).toEqual([]);
  });

  it("should pick the month's theme", () => {
    expect(themeFor(DISCOVER_THEMES, '2026-10-07')?.id).toBe('halloween');
    expect(themeFor(DISCOVER_THEMES, '2027-07-15')?.id).toBe('summer-trip');
  });

  it('should let an event win over its month', () => {
    expect(themeFor(DISCOVER_THEMES, '2027-02-14')?.id).toBe('valentines');
    expect(themeFor(DISCOVER_THEMES, '2027-02-15')?.id).toBe('love-month');
    expect(themeFor(DISCOVER_THEMES, '2026-11-26')?.id).toBe('thanksgiving');
  });

  it('should wrap an event over the new year', () => {
    expect(themeFor(DISCOVER_THEMES, '2026-12-31')?.id).toBe('new-year');
    expect(themeFor(DISCOVER_THEMES, '2027-01-01')?.id).toBe('new-year');
    expect(themeFor(DISCOVER_THEMES, '2027-01-02')?.id).toBe('snowed-in');
  });

  it('should give each month a theme of its own', () => {
    const months = Array.from({ length: 12 }, (_, index) => `2027-${String(index + 1).padStart(2, '0')}-20`);
    const ids = months.map((day) => themeFor(DISCOVER_THEMES, day)?.id);
    expect(new Set(ids).size).toBe(12);
  });

  it('should be undefined when nothing covers the day', () => {
    expect(themeFor([], '2026-10-07')).toBeUndefined();
  });
});
