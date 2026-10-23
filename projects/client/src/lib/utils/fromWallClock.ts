import { zoneOffset } from './zoneOffset.ts';

const DAY_MS = 86_400_000;

/**
 * The instant `timeZone`'s clock reads `wall`, given as milliseconds since the epoch as if that wall clock were UTC.
 * A time the clocks repeat when they go back is its first occurrence, and a time they skip when they go forward moves
 * on by the gap, as Temporal's `compatible` disambiguation does. Throws a RangeError for a zone Intl doesn't know.
 */
export function fromWallClock(wall: number, timeZone: string): number {
  const before = zoneOffset(wall - DAY_MS, timeZone);
  const after = zoneOffset(wall + DAY_MS, timeZone);
  const readsWall = (at: number) => at + zoneOffset(at, timeZone) === wall;
  const readings = [before, after].map((offset) => wall - offset).filter(readsWall);

  return readings.length > 0 ? Math.min(...readings) : wall - before;
}
