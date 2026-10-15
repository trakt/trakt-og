/** Which edge of the screen the Totally Ninja guy rises from: his feet, the image's bottom, sit on it. */
export type NinjaEdge = 'top' | 'right' | 'bottom' | 'left';

export interface NinjaEntrance {
  readonly edge: NinjaEdge;
  /** How far along that edge he rises, as a percentage, kept away from the corners. */
  readonly along: number;
}

const EDGES: readonly NinjaEdge[] = ['top', 'right', 'bottom', 'left'];
const MARGIN = 20;

/** A random edge and spot along it, from `random` (0 up to 1), so a test can pin it. */
export function ninjaEntrance(random: () => number = Math.random): NinjaEntrance {
  const edge = EDGES[Math.min(EDGES.length - 1, Math.floor(random() * EDGES.length))] ?? 'bottom';
  const along = Math.round(MARGIN + random() * (100 - 2 * MARGIN));
  return { edge, along };
}
