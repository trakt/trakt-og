/** Which recommendations: what's out now, or the titles still to come. */
export type RecommendationRelease = 'out_now' | 'coming_soon';

export const recommendationReleases = [
  { id: 'out_now', label: 'Out Now' },
  { id: 'coming_soon', label: 'Coming Soon' },
] as const satisfies readonly { id: RecommendationRelease; label: string }[];

/** The recommendations pages' query param, `?release=coming-soon`. Without it, Out Now. */
export const RELEASE_PARAM = 'release';
const COMING_SOON = 'coming-soon';

export const releaseFromParam = (value: string | null): RecommendationRelease =>
  value === COMING_SOON ? 'coming_soon' : 'out_now';

/** The query that opens a recommendations page on a release. Empty for Out Now. */
export const releaseSearch = (release: RecommendationRelease) =>
  release === 'coming_soon' ? `${RELEASE_PARAM}=${COMING_SOON}` : '';

/** The worker's route for a release: Coming Soon's own `/anticipated`, only for the signed-in viewer. */
export const recommendationsPath = (segment: 'media' | 'shows' | 'movies', release: RecommendationRelease) =>
  `/${segment}/recommendations${release === 'coming_soon' ? '/anticipated' : ''}`;
