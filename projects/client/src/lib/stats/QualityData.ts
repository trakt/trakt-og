import type { QualityPoint } from './QualityPoint.ts';

/** What the Quality chart draws: a show's seasons or a season's episodes, with the season's own rating as a line. */
export type QualityData = {
  readonly unit: 'season' | 'episode';
  readonly points: readonly QualityPoint[];
  readonly reference?: { readonly percent: number; readonly label: string };
};
