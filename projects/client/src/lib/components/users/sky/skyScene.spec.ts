import { describe, expect, it } from 'vitest';
import {
  advanceTraffic,
  courier,
  crossing,
  isOverMoon,
  moonAt,
  openingTraffic,
  pickWave,
  SKY,
  type SkyStar,
  skyStarAlpha,
  skyStarX,
  spawnSkyStar,
  type Traffic,
} from './skyScene.ts';

const fixed = (value: number) => () => value;
const size = { width: 1440, height: 900 };
const star: SkyStar = { x: 0.5, y: 0.5, depth: 1, radius: 1, phase: 0, twinkle: 1 };
const quiet: Traffic = { ships: [], bolts: [], streaks: [], nextWave: 100, nextStreak: 100 };

describe('skyScene', () => {
  describe('spawnSkyStar', () => {
    it('should spread stars a little past both edges, at one of the three depths', () => {
      expect(spawnSkyStar(fixed(0))).toMatchObject({ x: -SKY.overscan, y: -SKY.overscan, depth: 0.25 });
      expect(spawnSkyStar(fixed(0.99))).toMatchObject({ depth: 1 });
    });
  });

  describe('skyStarX', () => {
    it('should drift nearer stars further', () => {
      const near = skyStarX({ star, drift: 100, width: 1000 });
      const far = skyStarX({ star: { ...star, depth: 0.25 }, drift: 100, width: 1000 });
      expect(near).toBe(400);
      expect(far).toBe(475);
    });

    it('should wrap a star that drifts off the left edge back in on the right', () => {
      const x = skyStarX({ star: { ...star, x: 0 }, drift: 100, width: 1000 });
      expect(x).toBeGreaterThan(900);
      expect(x).toBeLessThanOrEqual(1050);
    });
  });

  describe('skyStarAlpha', () => {
    it('should shine nearer stars brighter', () => {
      const near = skyStarAlpha({ star, seconds: 0 });
      const far = skyStarAlpha({ star: { ...star, depth: 0.25 }, seconds: 0 });
      expect(near).toBeGreaterThan(far);
      expect(near).toBeLessThanOrEqual(1);
    });
  });

  describe('pickWave', () => {
    it('should mostly send single ships and only rarely a cruiser', () => {
      expect(pickWave(fixed(0))).toBe('fighter');
      expect(pickWave(fixed(0.5))).toBe('interceptor');
      expect(pickWave(fixed(0.8))).toBe('chase');
      expect(pickWave(fixed(0.95))).toBe('cruiser');
    });
  });

  describe('crossing', () => {
    it('should start off the left edge and head through the point', () => {
      const [ship] = crossing({ wave: 'fighter', through: { x: 720, y: 300 }, width: 1440, random: fixed(0.25) });
      expect(ship?.x).toBeLessThan(0);
      expect(ship?.gun).toBeNull();
      const along = (720 - (ship?.x ?? 0)) / Math.cos(ship?.angle ?? 0);
      expect((ship?.y ?? 0) + Math.sin(ship?.angle ?? 0) * along).toBeCloseTo(300);
    });

    it('should start off the right edge when it comes the other way', () => {
      const [ship] = crossing({ wave: 'interceptor', through: { x: 720, y: 300 }, width: 1440, random: fixed(0.75) });
      expect(ship?.x).toBeGreaterThan(1440);
    });

    it('should send a fighter with its gun loaded after an interceptor in a chase', () => {
      const [chaser, chased] = crossing({
        wave: 'chase',
        through: { x: 720, y: 300 },
        width: 1440,
        random: fixed(0.25),
      });
      expect(chaser).toMatchObject({ kind: 'fighter' });
      expect(chaser?.gun).not.toBeNull();
      expect(chased).toMatchObject({ kind: 'interceptor', gun: null });
      expect(chased?.x).toBeGreaterThan(chaser?.x ?? 0);
    });

    it('should crawl a cruiser across slowly', () => {
      const [ship] = crossing({ wave: 'cruiser', through: { x: 720, y: 100 }, width: 1440, random: fixed(0.25) });
      expect(ship?.speed).toBeLessThanOrEqual(SKY.cruiserSpeed[1]);
    });
  });

  describe('openingTraffic', () => {
    it('should open with a cruiser already in the sky', () => {
      const traffic = openingTraffic({ ...size, random: fixed(0.5) });
      expect(traffic.ships).toHaveLength(1);
      expect(traffic.ships[0]).toMatchObject({ kind: 'cruiser', x: 288, y: 144 });
      expect(traffic.nextWave).toBe(SKY.firstWave);
    });
  });

  describe('advanceTraffic', () => {
    it('should fly ships on along their heading', () => {
      const ship = courier({ x: 100, y: 100 });
      const [moved] = advanceTraffic({
        traffic: { ...quiet, ships: [ship] },
        seconds: 1,
        ...size,
        random: fixed(0.5),
      }).ships;
      expect(moved?.x).toBeCloseTo(100 + Math.cos(SKY.courierAngle) * SKY.courierSpeed);
      expect(moved?.y).toBeLessThan(100);
    });

    it('should keep a ship that is still flying in from off the edge', () => {
      const [ship] = crossing({ wave: 'fighter', through: { x: 720, y: 300 }, width: 1440, random: fixed(0.25) });
      const traffic = advanceTraffic({
        traffic: { ...quiet, ships: ship ? [ship] : [] },
        seconds: 0.01,
        ...size,
        random: fixed(0.5),
      });
      expect(traffic.ships).toHaveLength(1);
    });

    it('should drop a ship once it has flown past the margin', () => {
      const ship = {
        kind: 'fighter' as const,
        x: size.width + SKY.margin + 1,
        y: 300,
        angle: 0,
        speed: 100,
        gun: null,
      };
      expect(
        advanceTraffic({ traffic: { ...quiet, ships: [ship] }, seconds: 0.01, ...size, random: fixed(0.5) }).ships,
      ).toEqual([]);
    });

    it('should fire a bolt when a gun is loaded and reload it', () => {
      const ship = { kind: 'fighter' as const, x: 300, y: 300, angle: 0, speed: 100, gun: 0.01 };
      const traffic = advanceTraffic({
        traffic: { ...quiet, ships: [ship] },
        seconds: 0.02,
        ...size,
        random: fixed(0.5),
      });
      expect(traffic.bolts).toHaveLength(1);
      expect(traffic.bolts[0]?.speed).toBe(100 + SKY.boltSpeed);
      expect(traffic.ships[0]?.gun).toBeGreaterThan(0);
    });

    it('should let bolts and shooting stars burn out', () => {
      const old = { x: 0, y: 0, angle: 0, speed: 0, age: SKY.streakLife };
      const traffic = advanceTraffic({
        traffic: { ...quiet, bolts: [{ ...old, age: SKY.boltLife }], streaks: [old] },
        seconds: 0.01,
        ...size,
        random: fixed(0.5),
      });
      expect(traffic.bolts).toEqual([]);
      expect(traffic.streaks).toEqual([]);
    });

    it('should send the next wave and shooting star when they are due', () => {
      const traffic = advanceTraffic({
        traffic: { ...quiet, nextWave: 0.01, nextStreak: 0.01 },
        seconds: 0.02,
        ...size,
        random: fixed(0.5),
      });
      expect(traffic.ships).toHaveLength(1);
      expect(traffic.streaks).toHaveLength(1);
      expect(traffic.nextWave).toBeGreaterThanOrEqual(SKY.waveEvery[0]);
    });

    it('should never put a second cruiser in the sky', () => {
      const cruiser = { kind: 'cruiser' as const, x: 500, y: 100, angle: 0, speed: 16, gun: null };
      const traffic = advanceTraffic({
        traffic: { ...quiet, ships: [cruiser], nextWave: 0.01 },
        seconds: 0.02,
        ...size,
        random: fixed(0.95),
      });
      expect(traffic.ships.filter(({ kind }) => kind === 'cruiser')).toHaveLength(1);
    });
  });

  describe('isOverMoon', () => {
    const moon = moonAt({ ...size, lean: { x: 0, y: 0 } });

    it('should sit in the top right of the sky', () => {
      expect(moon.x).toBeCloseTo(1209.6);
      expect(moon.y).toBeCloseTo(162);
    });

    it('should count the pointer just past the rim as over it', () => {
      expect(isOverMoon({ pointer: { x: moon.x + SKY.moonRadius + 10, y: moon.y }, moon })).toBe(true);
      expect(isOverMoon({ pointer: { x: moon.x + 100, y: moon.y }, moon })).toBe(false);
      expect(isOverMoon({ pointer: null, moon })).toBe(false);
    });
  });
});
