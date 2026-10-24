import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { minimumAgeMinutes } from './minimumAgeMinutes.ts';

describe('util: minimumAgeMinutes', () => {
  it('should turn seconds into minutes', () => {
    expect(minimumAgeMinutes('[install]\nminimumReleaseAge = 86400\n')).toBe(1440);
  });

  it('should read the setting next to others and after a comment', () => {
    expect(minimumAgeMinutes('[install]\nlinker = "hoisted"\nminimumReleaseAge = 7200 # 2h\n')).toBe(120);
  });

  it('should accept 0, which turns the rule off', () => {
    expect(minimumAgeMinutes('[install]\nminimumReleaseAge = 0\n')).toBe(0);
  });

  it('should throw when the setting is missing, so the rule can never silently drop', () => {
    expect(() => minimumAgeMinutes('[install]\nlinker = "hoisted"\n')).toThrow(/minimumReleaseAge/);
  });

  it('should throw on forms it does not read', () => {
    expect(() => minimumAgeMinutes('minimumReleaseAge = "1d"')).toThrow();
    expect(() => minimumAgeMinutes('minimumReleaseAge = -5')).toThrow();
    expect(() => minimumAgeMinutes('minimumReleaseAge = 1.5')).toThrow();
  });

  it("should read the repo's own bunfig.toml as 24h", () => {
    expect(minimumAgeMinutes(readFileSync(new URL('../../../../bunfig.toml', import.meta.url), 'utf8'))).toBe(1440);
  });
});
