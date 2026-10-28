import { describe, expect, it } from 'vitest';
import { advanceStar, NEAR, projectStar, spawnStar, STARFIELD, trailDepth, warpSpeed } from './starfield.ts';

const fixed = (value: number) => () => value;
const star = { x: 0.5, y: -0.5, z: 0.5, accent: false };

describe('starfield', () => {
  describe('spawnStar', () => {
    it('should place a star across the field at the given depth', () => {
      expect(spawnStar({ random: fixed(0), z: 1 })).toEqual({ x: -1, y: -1, z: 1, accent: true });
      expect(spawnStar({ random: fixed(0.99), z: 0.3 })).toMatchObject({ z: 0.3, accent: false });
    });
  });

  describe('warpSpeed', () => {
    it('should drift as the loader opens and cruise once the ramp is done', () => {
      expect(warpSpeed(0)).toBe(STARFIELD.startSpeed);
      expect(warpSpeed(STARFIELD.rampMs)).toBe(STARFIELD.cruiseSpeed);
      expect(warpSpeed(STARFIELD.rampMs * 10)).toBe(STARFIELD.cruiseSpeed);
    });

    it('should speed up steadily in between', () => {
      const half = warpSpeed(STARFIELD.rampMs / 2);
      expect(half).toBeGreaterThan(STARFIELD.startSpeed);
      expect(half).toBeLessThan(STARFIELD.cruiseSpeed);
      expect(warpSpeed(STARFIELD.rampMs * 0.75)).toBeGreaterThan(half);
    });
  });

  describe('advanceStar', () => {
    it('should bring a star nearer, or push it deeper in reverse', () => {
      expect(advanceStar({ star, distance: 0.1, reverse: false, random: fixed(0.5) }).z).toBeCloseTo(0.4);
      expect(advanceStar({ star, distance: 0.1, reverse: true, random: fixed(0.5) }).z).toBeCloseTo(0.6);
    });

    it('should send a star that passed the viewer back to the far end', () => {
      expect(advanceStar({ star: { ...star, z: NEAR }, distance: 0.01, reverse: false, random: fixed(0.5) }).z).toBe(1);
    });

    it('should bring a star that reached the far end back near the viewer in reverse', () => {
      const next = advanceStar({ star: { ...star, z: 0.99 }, distance: 0.05, reverse: true, random: fixed(0.5) });
      expect(next.z).toBeCloseTo(NEAR + 0.05);
    });
  });

  describe('projectStar', () => {
    it('should spread stars from the center, further the nearer they are', () => {
      expect(projectStar({ star, z: 1, width: 1000, height: 500 })).toEqual({ x: 750, y: 0 });
      expect(projectStar({ star, z: 0.5, width: 1000, height: 500 })).toEqual({ x: 1000, y: -250 });
      expect(projectStar({ star: { ...star, x: 0, y: 0 }, z: 0.1, width: 1000, height: 500 })).toEqual({
        x: 500,
        y: 250,
      });
    });
  });

  describe('trailDepth', () => {
    it('should lengthen streaks with speed up to a short dash', () => {
      expect(trailDepth(STARFIELD.startSpeed)).toBeLessThan(trailDepth(STARFIELD.cruiseSpeed));
      expect(trailDepth(10)).toBe(0.03);
    });
  });
});
