type Params = {
  /** Every value the chart draws, its reference line too. */
  values: readonly number[];
  zoom: boolean;
};

/** Room under the lowest value in zoom, so its dot doesn't sit on the axis. */
const HEADROOM = 2;
const STEP = 10;
const FULL_STEP = 25;
const TOP = 100;

/**
 * The Quality chart's vertical scale. Full runs 0 to 100 with a level every 25; zoom lowers the bottom to the nearest
 * 10 under the lowest value, less a little headroom, with a level every 10. `at` is a percent's height up the plot.
 */
export function qualityScale({ values, zoom }: Params) {
  const lowest = Math.min(...values);
  const low =
    zoom && values.length > 0 ? Math.max(0, Math.min(TOP - STEP, Math.floor((lowest - HEADROOM) / STEP) * STEP)) : 0;
  const step = zoom ? STEP : FULL_STEP;
  const levels = Array.from({ length: Math.floor((TOP - low) / step) + 1 }, (_, i) => low + i * step);
  return { low, levels, at: (value: number) => ((value - low) / (TOP - low)) * 100 };
}
