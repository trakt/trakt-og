import { type ParentalLimits, parentalCategories } from './parentalGuide.ts';

export type ParentalPresetId = 'any' | 'kids' | 'teens';

/** The presets over the grid. Picking one fills every row; any other mix is Custom, where no preset is lit. */
export const parentalPresets: Readonly<Record<ParentalPresetId, ParentalLimits>> = {
  any: {},
  kids: { nudity: 0, violence: 1, profanity: 0, alcohol: 0, frightening: 1 },
  teens: { nudity: 1, violence: 2, profanity: 2, alcohol: 2, frightening: 2 },
};

const presetIds = Object.keys(parentalPresets) as ParentalPresetId[];

const sameLimits = (a: ParentalLimits, b: ParentalLimits) =>
  parentalCategories.every((category) => a[category] === b[category]);

/** The preset these limits match, or undefined for Custom. */
export const parentalPreset = (limits: ParentalLimits): ParentalPresetId | undefined =>
  presetIds.find((id) => sameLimits(limits, parentalPresets[id]));
