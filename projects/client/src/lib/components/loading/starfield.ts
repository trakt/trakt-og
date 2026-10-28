/** A star in the field: `x` and `y` across it from -1 to 1, `z` deep, from 1 at the far end to near 0 at the viewer. */
export interface Star {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly accent: boolean;
}

type Random = () => number;

/** The nearest a star gets before it passes the viewer. */
export const NEAR = 0.02;

export const STARFIELD = {
  count: 600,
  /** Depth crossed per second as the loader opens, and once it's up to speed. */
  startSpeed: 0.04,
  cruiseSpeed: 0.28,
  rampMs: 2000,
  /** The share of stars in the accent color. */
  accentShare: 0.08,
} as const;

/** A new star at depth `z`. */
export function spawnStar({ random, z }: { random: Random; z: number }): Star {
  return { x: random() * 2 - 1, y: random() * 2 - 1, z, accent: random() < STARFIELD.accentShare };
}

/** Depth crossed per second `elapsedMs` after the loader opened, easing from a drift up to cruise. */
export function warpSpeed(elapsedMs: number): number {
  const t = Math.min(Math.max(elapsedMs / STARFIELD.rampMs, 0), 1);
  const eased = t * t * (3 - 2 * t);
  return STARFIELD.startSpeed + (STARFIELD.cruiseSpeed - STARFIELD.startSpeed) * eased;
}

type AdvanceParams = {
  star: Star;
  distance: number;
  /** Away from the viewer, back into the middle. */
  reverse: boolean;
  random: Random;
};

/** The star moved `distance` deeper or nearer. One that leaves the field comes back where stars enter it. */
export function advanceStar({ star, distance, reverse, random }: AdvanceParams): Star {
  const z = star.z + (reverse ? distance : -distance);
  if (z > NEAR && z <= 1) return { ...star, z };

  return spawnStar({ random, z: reverse ? NEAR + random() * 0.1 : 1 });
}

type ProjectParams = {
  star: Star;
  z: number;
  width: number;
  height: number;
};

/** Where the star lands on a `width` by `height` canvas at depth `z`, spreading from its center. */
export function projectStar({ star, z, width, height }: ProjectParams): { x: number; y: number } {
  const focal = Math.max(width, height) / 2;
  return { x: width / 2 + (star.x / z) * focal, y: height / 2 + (star.y / z) * focal };
}

/** How much depth a star's streak covers at `speed`: longer as it speeds up, but never more than a short dash. */
export function trailDepth(speed: number): number {
  return Math.min(0.01 + speed * 0.05, 0.03);
}
