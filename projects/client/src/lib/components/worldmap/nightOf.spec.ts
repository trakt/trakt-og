import { describe, expect, it } from 'vitest';
import { nightOf, toPlace } from './nightOf.ts';

const projection = { fit: 100, offsetX: 500, offsetY: 250 };
const degrees = (radians: number) => Math.round((radians * 180) / Math.PI);

describe('nightOf', () => {
  it('should turn the projection origin back into 0°, 0°', () => {
    expect(toPlace({ x: 500, y: 250 }, projection)).toEqual({ phi: 0, lambda: 0 });
  });

  it('should undo the projection for a point away from the origin', () => {
    const place = toPlace({ x: 500 + 100 * (Math.PI / 2) * 0.8707 * 0.95, y: 250 - 70 }, projection);

    expect(degrees(place.phi)).toBe(40);
    expect(degrees(place.lambda)).toBeGreaterThan(80);
  });

  it('should light the side of the world under the sun and darken the other', () => {
    const noonInLondon = new Date('2026-03-20T12:00:00Z');
    const [greenwich, dateLine] = nightOf(
      [
        { phi: 0, lambda: 0 },
        { phi: 0, lambda: Math.PI },
      ],
      noonInLondon,
    );

    expect(greenwich).toBe(0);
    expect(dateLine).toBe(1);
  });

  it('should fade through twilight at the edge of the night', () => {
    const [dusk = 0] = nightOf([{ phi: 0, lambda: Math.PI / 2 + 0.02 }], new Date('2026-03-20T12:00:00Z'));

    expect(dusk).toBeGreaterThan(0);
    expect(dusk).toBeLessThan(1);
  });
});
