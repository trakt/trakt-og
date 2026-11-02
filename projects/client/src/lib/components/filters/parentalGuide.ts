/**
 * IMDb's parental guide as a filter: the most each category may have, from None (0) to Severe (3). The URL and the
 * API both take it as `parental_<category>=0-<level>`; a category left out isn't filtered. Once one is, titles IMDb
 * hasn't rated are left out too, so Severe still narrows a row to rated titles.
 */

export const parentalCategories = ['nudity', 'violence', 'profanity', 'alcohol', 'frightening'] as const;
export type ParentalCategory = (typeof parentalCategories)[number];

/** IMDb's "Alcohol, Drugs & Smoking" is just Drugs, so every row fits on one line. */
export const parentalCategoryLabels: Readonly<Record<ParentalCategory, string>> = {
  nudity: 'Nudity',
  violence: 'Violence',
  profanity: 'Profanity',
  alcohol: 'Drugs',
  frightening: 'Frightening',
};

export const parentalLevels = [0, 1, 2, 3] as const;
export type ParentalLevel = (typeof parentalLevels)[number];

export const parentalLevelLabels: Readonly<Record<ParentalLevel, string>> = {
  0: 'None',
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
};

export type ParentalLimits = Readonly<Partial<Record<ParentalCategory, ParentalLevel>>>;

export const isParentalLevel = (value: number): value is ParentalLevel =>
  parentalLevels.some((level) => level === value);

export const parentalParam = (category: ParentalCategory) => `parental_${category}`;

/** Every query param the filter reads. */
export const parentalParams: readonly string[] = parentalCategories.map(parentalParam);

/** The URL's and the API's params for these limits. */
export const parentalGuideParams = (limits: ParentalLimits): [string, string][] =>
  parentalCategories.flatMap((category): [string, string][] => {
    const level = limits[category];
    return level === undefined ? [] : [[parentalParam(category), `0-${level}`]];
  });

/** One limit in words: "None", or "up to Mild". */
export const parentalLimitLabel = (level: ParentalLevel) =>
  level === 0 ? parentalLevelLabels[0] : `up to ${parentalLevelLabels[level]}`;
