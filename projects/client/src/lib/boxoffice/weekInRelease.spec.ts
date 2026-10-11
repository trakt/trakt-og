import { describe, expect, it } from 'vitest';
import { weekInRelease } from './weekInRelease.ts';

describe('util: weekInRelease', () => {
  const friday = '2026-10-02';

  it('should call a film out that Friday, or that Wednesday or Thursday, an opening', () => {
    expect(weekInRelease('2026-10-02', friday)).toEqual({ kind: 'opening', label: 'Opening' });
    expect(weekInRelease('2026-09-30', friday)?.kind).toBe('opening');
  });

  it('should count the weeks since it opened', () => {
    expect(weekInRelease('2026-09-25', friday)?.label).toBe('Week 2');
    expect(weekInRelease('2026-09-11', friday)?.label).toBe('Week 4');
    expect(weekInRelease('2026-07-31', friday)?.label).toBe('Week 10');
  });

  it('should mark a film out for over a year as a re-release', () => {
    expect(weekInRelease('2019-04-26', friday)).toEqual({ kind: 're-release', label: 'Re-release · 2019' });
  });

  it('should have nothing without a release date', () => {
    expect(weekInRelease(null, friday)).toBeNull();
  });
});
