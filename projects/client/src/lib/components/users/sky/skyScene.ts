/** A point on the sky's canvas, in CSS pixels from its top left. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** A still star: `x` and `y` across the sky from a little past one edge to a little past the other, `depth` from far
 * (0.25) to near (1). Nearer stars are bigger and brighter, and drift and lean further. */
export interface SkyStar extends Point {
  readonly depth: number;
  readonly radius: number;
  readonly phase: number;
  readonly twinkle: number;
}

export type ShipKind = 'fighter' | 'interceptor' | 'cruiser';

/** A ship crossing the sky, heading `angle` radians at `speed` pixels a second. */
export interface Ship extends Point {
  readonly kind: ShipKind;
  readonly angle: number;
  readonly speed: number;
  /** Seconds to its next shot, or null for a ship that doesn't shoot. */
  readonly gun: number | null;
}

/** A laser bolt or a shooting star, `age` seconds into its short life. */
export interface Shot extends Point {
  readonly angle: number;
  readonly speed: number;
  readonly age: number;
}

export interface Traffic {
  readonly ships: readonly Ship[];
  readonly bolts: readonly Shot[];
  readonly streaks: readonly Shot[];
  /** Seconds until the next ship or chase crosses, and the next shooting star. */
  readonly nextWave: number;
  readonly nextStreak: number;
}

export type Wave = ShipKind | 'chase';

type Random = () => number;
type Range = readonly [number, number];
type Size = { width: number; height: number };

export const SKY = {
  stars: 280,
  depths: [0.25, 0.55, 1],
  /** How much of the sky's width the stars spread past each edge, so drift and lean never show a bare strip. */
  overscan: 0.05,
  firstWave: 2,
  waveEvery: [6, 12],
  streakEvery: [5, 11],
  fighterSpeed: [140, 200],
  cruiserSpeed: [14, 20],
  /** The steepest a crossing tilts from level, in radians. */
  tilt: 0.22,
  /** How far off the edge a crossing starts, and how far past the sky a ship flies before it's gone. */
  entry: 100,
  margin: 200,
  chaseGap: 52,
  fireEvery: [0.22, 0.5],
  boltSpeed: 420,
  boltLife: 1.2,
  streakSpeed: 620,
  streakLife: 0.8,
  courierSpeed: 210,
  courierAngle: -0.6,
  moonRadius: 20,
  /** How far past its rim the pointer still counts as over the moon. */
  moonReach: 14,
} as const satisfies Record<string, number | Range | readonly number[]>;

const between = (random: Random, [min, max]: Range) => min + random() * (max - min);

export function spawnSkyStar(random: Random): SkyStar {
  const span = 1 + SKY.overscan * 2;
  return {
    x: random() * span - SKY.overscan,
    y: random() * span - SKY.overscan,
    depth: SKY.depths.at(Math.floor(random() * SKY.depths.length)) ?? 1,
    radius: 0.4 + random() * 1.1,
    phase: random() * Math.PI * 2,
    twinkle: 0.4 + random() * 1.6,
  };
}

/** Where a star sits across a `width` wide sky once the field has drifted `drift` pixels left, wrapping at the edges. */
export function skyStarX({ star, drift, width }: { star: SkyStar; drift: number; width: number }): number {
  const pad = width * SKY.overscan;
  const span = width + pad * 2;
  const x = star.x * width - drift * star.depth + pad;
  return (((x % span) + span) % span) - pad;
}

/** A star's brightness `seconds` in: nearer stars shine brighter, and every star twinkles at its own pace. */
export function skyStarAlpha({ star, seconds }: { star: SkyStar; seconds: number }): number {
  const shimmer = 0.5 + 0.5 * Math.sin(seconds * star.twinkle + star.phase);
  return (0.25 + 0.55 * star.depth) * (0.45 + 0.55 * shimmer);
}

export function pickWave(random: Random): Wave {
  const roll = random();
  if (roll < 0.38) return 'fighter';
  if (roll < 0.66) return 'interceptor';
  if (roll < 0.9) return 'chase';
  return 'cruiser';
}

type CrossingParams = { wave: Wave; through: Point; width: number; random: Random };

/**
 * Ships on a line through `through`, starting just off the side they enter from. A chase is a fighter firing at an
 * interceptor ahead of it.
 */
export function crossing({ wave, through, width, random }: CrossingParams): readonly Ship[] {
  const fromLeft = random() < 0.5;
  const angle = (fromLeft ? 0 : Math.PI) + (random() * 2 - 1) * SKY.tilt;
  const speed = between(random, wave === 'cruiser' ? SKY.cruiserSpeed : SKY.fighterSpeed);
  const run = ((fromLeft ? through.x : width - through.x) + SKY.entry) / Math.abs(Math.cos(angle));
  const x = through.x - Math.cos(angle) * run;
  const y = through.y - Math.sin(angle) * run;
  if (wave !== 'chase') return [{ kind: wave, x, y, angle, speed, gun: null }];

  return [
    { kind: 'fighter', x, y, angle, speed, gun: between(random, SKY.fireEvery) },
    {
      kind: 'interceptor',
      x: x + Math.cos(angle) * SKY.chaseGap,
      y: y + Math.sin(angle) * SKY.chaseGap,
      angle,
      speed,
      gun: null,
    },
  ];
}

/** The sky as the page opens: a cruiser already partway across the top, so it's never empty. */
export function openingTraffic({ width, height, random }: Size & { random: Random }): Traffic {
  return {
    ships: [
      { kind: 'cruiser', x: width * 0.2, y: height * 0.16, angle: (random() * 2 - 1) * 0.06, speed: 16, gun: null },
    ],
    bolts: [],
    streaks: [],
    nextWave: SKY.firstWave,
    nextStreak: between(random, SKY.streakEvery),
  };
}

/** A ship leaving `from` up and to the right, carrying the viewer's follow request. */
export function courier(from: Point): Ship {
  return { kind: 'fighter', ...from, angle: SKY.courierAngle, speed: SKY.courierSpeed, gun: null };
}

const fly = (ship: Ship, seconds: number): Ship => ({
  ...ship,
  x: ship.x + Math.cos(ship.angle) * ship.speed * seconds,
  y: ship.y + Math.sin(ship.angle) * ship.speed * seconds,
  gun: ship.gun === null ? null : ship.gun - seconds,
});

const move = (shot: Shot, seconds: number): Shot => ({
  ...shot,
  x: shot.x + Math.cos(shot.angle) * shot.speed * seconds,
  y: shot.y + Math.sin(shot.angle) * shot.speed * seconds,
  age: shot.age + seconds,
});

const loaded = (ship: Ship) => ship.gun !== null && ship.gun <= 0;

const bolt = (ship: Ship, random: Random): Shot => {
  const angle = ship.angle + (random() * 2 - 1) * 0.05;
  return {
    x: ship.x + Math.cos(angle) * 11,
    y: ship.y + Math.sin(angle) * 11,
    angle,
    speed: ship.speed + SKY.boltSpeed,
    age: 0,
  };
};

/** Gone once it's past the margin and still flying away from the middle of the sky. */
const gone = (ship: Ship, { width, height }: Size) => {
  const outside =
    ship.x < -SKY.margin || ship.x > width + SKY.margin || ship.y < -SKY.margin || ship.y > height + SKY.margin;
  const away = (width / 2 - ship.x) * Math.cos(ship.angle) + (height / 2 - ship.y) * Math.sin(ship.angle) < 0;
  return outside && away;
};

const shootingStar = ({ width, height, random }: Size & { random: Random }): Shot => {
  const fall = between(random, [0.3, 0.6]);
  return {
    x: between(random, [width * 0.1, width * 0.9]),
    y: random() * height * 0.4,
    angle: random() < 0.5 ? fall : Math.PI - fall,
    speed: SKY.streakSpeed,
    age: 0,
  };
};

const nextWave = ({ traffic, height, width, random }: Size & { traffic: Traffic; random: Random }) => {
  const picked = pickWave(random);
  const wave = picked === 'cruiser' && traffic.ships.some(({ kind }) => kind === 'cruiser') ? 'fighter' : picked;
  const y =
    wave === 'cruiser'
      ? between(random, [height * 0.08, height * 0.25])
      : between(random, [height * 0.1, height * 0.85]);
  return crossing({ wave, through: { x: width / 2, y }, width, random });
};

type AdvanceParams = Size & { traffic: Traffic; seconds: number; random: Random };

/** The sky `seconds` later: everything moves on, loaded guns fire, and new ships and shooting stars arrive on time. */
export function advanceTraffic({ traffic, seconds, width, height, random }: AdvanceParams): Traffic {
  const moved = traffic.ships.map((ship) => fly(ship, seconds));
  const fired = moved.filter(loaded).map((ship) => bolt(ship, random));
  const ships = moved
    .map((ship) => (loaded(ship) ? { ...ship, gun: between(random, SKY.fireEvery) } : ship))
    .filter((ship) => !gone(ship, { width, height }));
  const bolts = traffic.bolts.map((shot) => move(shot, seconds)).filter(({ age }) => age < SKY.boltLife);
  const streaks = traffic.streaks.map((shot) => move(shot, seconds)).filter(({ age }) => age < SKY.streakLife);
  const waveDue = traffic.nextWave - seconds <= 0;
  const streakDue = traffic.nextStreak - seconds <= 0;

  return {
    ships: waveDue ? [...ships, ...nextWave({ traffic, width, height, random })] : ships,
    bolts: [...bolts, ...fired],
    streaks: streakDue ? [...streaks, shootingStar({ width, height, random })] : streaks,
    nextWave: waveDue ? between(random, SKY.waveEvery) : traffic.nextWave - seconds,
    nextStreak: streakDue ? between(random, SKY.streakEvery) : traffic.nextStreak - seconds,
  };
}

/** The moon's center on a `width` by `height` sky, leaning a little against the pointer like the far stars. */
export function moonAt({ width, height, lean }: Size & { lean: Point }): Point {
  return { x: width * 0.84 - lean.x * 10, y: height * 0.18 - lean.y * 6 };
}

export function isOverMoon({ pointer, moon }: { pointer: Point | null; moon: Point }): boolean {
  if (!pointer) return false;
  return Math.hypot(pointer.x - moon.x, pointer.y - moon.y) < SKY.moonRadius + SKY.moonReach;
}
