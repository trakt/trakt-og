import { describe, expect, it } from 'vitest';
import { boxMath } from '../boxMath.ts';
import { historySpans } from './fetchWatchHistory.ts';

const today = boxMath.utcDay('2026-10-05T12:00:00.000Z');
const labels = (joinedAt: string | null) => historySpans(joinedAt, today).map(({ label }) => label);

describe('historySpans', () => {
  it('should give a newcomer a bar a week since joining', () => {
    expect(labels('2026-09-20T10:00:00.000Z')).toEqual(['Sep 20 to Sep 26', 'Sep 27 to Oct 3', 'Oct 4 to Oct 5']);
  });

  it('should go by month under two years, from the month they joined', () => {
    const spans = labels('2025-06-14T10:00:00.000Z');
    expect(spans.at(0)).toBe('Jun 2025');
    expect(spans.at(-1)).toBe('Oct 2026');
    expect(spans).toHaveLength(17);
  });

  it('should go by quarter under six years, and by year after', () => {
    expect(labels('2022-02-01T10:00:00.000Z').slice(0, 2)).toEqual(['Jan - Mar 2022', 'Apr - Jun 2022']);
    expect(labels('2014-03-02T10:00:00.000Z')).toEqual(Array.from({ length: 13 }, (_, i) => String(2014 + i)));
  });

  it('should end every span on its last day, and the last one today', () => {
    const spans = historySpans('2025-06-14T10:00:00.000Z', today);
    expect(spans.at(0)).toMatchObject({ start: boxMath.utcDay('2025-06-01'), end: boxMath.utcDay('2025-06-30') });
    expect(spans.at(-1)?.end).toBe(today);
  });

  it('should fall back to the last year by month without a join date', () => {
    expect(labels(null).at(0)).toBe('Nov 2025');
  });
});
