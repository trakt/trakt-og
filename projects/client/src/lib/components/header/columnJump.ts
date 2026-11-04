type ColumnJumpParams = {
  /** How many options each column holds, left to right, numbered on from the first column's. */
  columns: readonly number[];
  /** The highlighted option, or -1 for none. */
  highlight: number;
  step: 1 | -1;
};

/**
 * Where ← or → moves the highlight across side-by-side columns: the same row in the next column, or its last when it's
 * shorter. With nothing highlighted, → starts the second column and ← the first. Null when there's nowhere to go.
 */
export function columnJump({ columns, highlight, step }: ColumnJumpParams): number | null {
  const starts = columns.map((_, index) => columns.slice(0, index).reduce((sum, count) => sum + count, 0));
  if (highlight < 0) return starts.at(step > 0 ? 1 : 0) ?? null;

  const from = starts.findIndex((start, index) => highlight >= start && highlight < start + (columns.at(index) ?? 0));
  if (from < 0) return null;

  const to = from + step;
  const start = starts.at(to);
  const count = columns.at(to) ?? 0;
  if (to < 0 || start === undefined || count === 0) return null;

  return start + Math.min(highlight - (starts.at(from) ?? 0), count - 1);
}
