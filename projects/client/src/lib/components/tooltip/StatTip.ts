import type { TooltipLine } from './TooltipLine.ts';

/**
 * A tooltip's stat, as the charts drew it: "MON, SEP 29" small and gray, "2h 14m" big, then its lines. A rewatch's
 * progress is two of these under a divider.
 */
export type StatTip = Readonly<{
  label?: string;
  value?: string;
  /** Gray after the value: "12 / 20 episodes", "ratings". */
  unit?: string;
  /** A bold line in place of a value, like an episode's title. */
  title?: string;
  lines?: readonly TooltipLine[];
}>;
