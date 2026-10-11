import { describe, expect, it } from 'vitest';
import { boxOfficeWeekend } from './boxOfficeWeekend.ts';

describe('util: boxOfficeWeekend', () => {
  it('should cover the last full weekend before today', () => {
    expect(boxOfficeWeekend('2026-10-08')).toEqual({
      friday: '2026-10-02',
      sunday: '2026-10-04',
      label: 'Oct 2 – 4, 2026',
    });
    expect(boxOfficeWeekend('2026-10-05')).toMatchObject({ friday: '2026-10-02', sunday: '2026-10-04' });
  });

  it('should still show last weekend while this one runs', () => {
    expect(boxOfficeWeekend('2026-10-10')).toMatchObject({ friday: '2026-10-02' });
    expect(boxOfficeWeekend('2026-10-11')).toMatchObject({ friday: '2026-10-02', sunday: '2026-10-04' });
  });

  it('should name both months, or both years, when the weekend spans them', () => {
    expect(boxOfficeWeekend('2026-11-04').label).toBe('Oct 30 – Nov 1, 2026');
    expect(boxOfficeWeekend('2027-01-05').label).toBe('Jan 1 – 3, 2027');
    expect(boxOfficeWeekend('2028-01-04').label).toBe('Dec 31, 2027 – Jan 2, 2028');
  });
});
