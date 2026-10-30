import { describe, expect, it } from 'vitest';
import { browserTimeZone } from './browserTimeZone.ts';

describe('browserTimeZone', () => {
  it.each(['America/Chicago', 'UTC'])('should read %s from the cookie', (zone) => {
    expect(browserTimeZone.read(zone)).toBe(zone);
  });

  it.each([undefined, '', 'Mars/Olympus_Mons', 'Central Time (US & Canada)'])(
    'should ignore a cookie of %s',
    (value) => {
      expect(browserTimeZone.read(value)).toBeUndefined();
    },
  );
});
