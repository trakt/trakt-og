import { describe, expect, it } from 'vitest';
import { monthGrid } from './monthGrid.ts';

describe('monthGrid', () => {
  it('should pad October 2026 to five Sunday weeks', () => {
    const weeks = monthGrid({ month: '2026-10' });
    expect(weeks).toHaveLength(5);
    expect(weeks.at(0)?.at(0)).toEqual({ date: '2026-09-27', inMonth: false });
    expect(weeks.at(0)?.at(4)).toEqual({ date: '2026-10-01', inMonth: true });
    expect(weeks.at(-1)?.at(-1)).toEqual({ date: '2026-10-31', inMonth: true });
  });

  it('should start the weeks on the given day', () => {
    const weeks = monthGrid({ month: '2026-11-01', weekStart: 1 });
    expect(weeks.at(0)?.at(0)?.date).toBe('2026-10-26');
    expect(weeks.at(-1)?.at(-1)?.date).toBe('2026-12-06');
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });
});
