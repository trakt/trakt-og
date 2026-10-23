import { addDays } from '../../src/lib/utils/addDays.ts';

/** The `YYYY-MM-DD` Monday, in UTC, of the week a moment falls in. */
export function mondayOf(at: Date): string {
  return addDays(at.toISOString().slice(0, 10), -((at.getUTCDay() + 6) % 7));
}
