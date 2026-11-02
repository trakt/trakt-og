import type { ChartName } from '../../charts/chartNames.ts';

const CHARTS = ['trending', 'popular', 'anticipated', 'recommendations'] as const;

export type SmartListChart = (typeof CHARTS)[number];

/** The charts that are also smart list sources. The period charts and Box Office aren't. */
export const isSmartListChart = (chart: ChartName | string): chart is SmartListChart =>
  CHARTS.some((name) => name === chart);
