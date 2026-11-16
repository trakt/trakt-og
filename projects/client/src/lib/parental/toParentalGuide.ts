import type { z } from 'zod/v4';
import { parentalCategories, type ParentalLevel } from '../components/filters/parentalGuide.ts';
import type { ParentalGuide } from './ParentalGuide.ts';
import type { parentalGuideSchema } from './parentalGuideSchema.ts';

const LEVELS: Readonly<Record<string, ParentalLevel>> = { NONE: 0, MILD: 1, MODERATE: 2, SEVERE: 3 };

/** The API's guide in the filter's category order, leaving out categories og doesn't know. */
export function toParentalGuide({ guide }: z.infer<typeof parentalGuideSchema>): ParentalGuide {
  return parentalCategories.flatMap((category) => {
    const row = guide.find((entry) => entry.category.toLowerCase() === category);
    const level = row ? LEVELS[row.severity] : undefined;
    return level === undefined ? [] : [{ category, level }];
  });
}
