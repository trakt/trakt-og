import { describe, expect, it } from 'vitest';
import { airsTip } from './airsTip.ts';

const now = new Date('2026-11-13T18:00:00.000Z');
const parts = (at: string) => ({ date: at.slice(0, 10), time: at.slice(11, 16) });

describe('airsTip', () => {
  it('should say when a streaming episode airs, and on which network', () => {
    expect(airsTip('2026-11-16T01:00:00.000Z', { network: 'Showtime', now, parts })).toEqual({
      label: 'Airs',
      date: '2026-11-16',
      time: '01:00',
      network: 'Showtime',
    });
  });

  it('should say Aired once it has, and leave out a missing network', () => {
    expect(airsTip('2026-11-01T01:00:00.000Z', { now, parts })).toEqual({
      label: 'Aired',
      date: '2026-11-01',
      time: '01:00',
    });
  });

  it('should be undefined without a broadcast', () => {
    expect(airsTip(null, { now, parts })).toBeUndefined();
  });
});
