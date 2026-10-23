import { fromWallClock } from '../../utils/fromWallClock.ts';
import { watchDateInput } from './watchDateInput.ts';

/** Resolve the account wall clock to UTC. Reject impossible dates and DST gaps instead of shifting them. */
export function watchDateInstant(value: string, timeZone: string): string | null {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value)) return null;
  const wall = Date.parse(`${value}Z`);
  if (!Number.isFinite(wall)) return null;
  const resolved = new Date(fromWallClock(wall, timeZone));
  return watchDateInput(resolved, timeZone) === value ? resolved.toISOString() : null;
}
