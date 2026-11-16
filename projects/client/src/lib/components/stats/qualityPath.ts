type Params = {
  /** A value per column, null for a gap. */
  values: readonly (number | null)[];
  /** A value's height up the plot, 0 to 100. */
  at: (value: number) => number;
  /** Closes each run down to the plot's floor, for the shade under the line. */
  area?: boolean;
};

type Point = readonly [x: number, y: number];

const joined = (run: readonly Point[]) => run.map(([x, y]) => `${x} ${y}`).join('L');

function shape(run: readonly Point[], area: boolean) {
  if (!area) return `M${joined(run)}`;
  const first = run.at(0)?.[0] ?? 0;
  const last = run.at(-1)?.[0] ?? 0;
  return `M${first} 100L${joined(run)}L${last} 100Z`;
}

/**
 * A line's SVG path over a 100 by 100 plot with one column per value, each point at its column's middle. A null
 * breaks it, so the line resumes with a new subpath; a point on its own has no line, only its dot. With `area`, each
 * run is closed down to the floor instead.
 */
export function qualityPath({ values, at, area = false }: Params) {
  const width = 100 / values.length;
  return values
    .map((value, i): Point | null => (value === null ? null : [(i + 0.5) * width, 100 - at(value)]))
    .reduce<Point[][]>(
      (runs, point) => {
        if (point === null) return [...runs, []];
        const last = runs.at(-1) ?? [];
        return [...runs.slice(0, -1), [...last, point]];
      },
      [[]],
    )
    .filter((run) => run.length > 1)
    .map((run) => shape(run, area))
    .join('');
}
