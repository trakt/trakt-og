/** Which edge of the screen an extra rises from: the image's bottom sits on it. */
export type Edge = 'top' | 'right' | 'bottom' | 'left';

export interface EdgeEntrance {
  readonly edge: Edge;
  /** How far along that edge it rises, as a percentage, kept away from the corners. */
  readonly along: number;
}

const EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'];
const MARGIN = 20;

/** A random edge and spot along it, from `random` (0 up to 1), so a test can pin it. */
export function edgeEntrance(random: () => number = Math.random): EdgeEntrance {
  const edge = EDGES[Math.min(EDGES.length - 1, Math.floor(random() * EDGES.length))] ?? 'bottom';
  const along = Math.round(MARGIN + random() * (100 - 2 * MARGIN));
  return { edge, along };
}
