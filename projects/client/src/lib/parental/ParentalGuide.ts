import type { ParentalCategory, ParentalLevel } from '../components/filters/parentalGuide.ts';

/** A title's parental guide, one level per category, in the filter's category order. Empty without one. */
export type ParentalGuide = readonly { readonly category: ParentalCategory; readonly level: ParentalLevel }[];
