/** Below OG's md container a PosterGrid shows four columns at most (col-sm-3), and below sm its phone columns. */
const MD = 940;
const SM = 720;

/**
 * How many columns a PosterGrid this wide shows, matching its container queries, so a panel can fill whole rows.
 * Unmeasured (0, on the server), the desktop columns.
 */
export function visibleColumns(width: number, columns: number, phoneColumns = 2): number {
  if (width <= 0 || width >= MD) return columns;
  return Math.min(columns, width < SM ? phoneColumns : 4);
}
