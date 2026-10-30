import imdb from '$lib/assets/sites/imdb-solid.svg';
import justwatch from '$lib/assets/sites/justwatch-yellow.svg';
import letterboxd from '$lib/assets/sites/letterboxd.svg';
import mal from '$lib/assets/sites/mal.svg';
import metacritic from '$lib/assets/sites/metacritic.png';
import audienceCertified from '$lib/assets/sites/rt/audience-certified.svg';
import audienceSpilled from '$lib/assets/sites/rt/audience-spilled.svg';
import audienceUpright from '$lib/assets/sites/rt/audience-upright.svg';
import tomatometerCertified from '$lib/assets/sites/rt/tomatometer-certified.svg';
import tomatometerFresh from '$lib/assets/sites/rt/tomatometer-fresh.svg';
import tomatometerRotten from '$lib/assets/sites/rt/tomatometer-rotten.svg';
import tmdb from '$lib/assets/sites/tmdb.svg';
import type { ExternalRatingLogo } from './ExternalRating.ts';

/** Each external rating's logo image, for the ratings strip and the stats page's Other Sites. */
export const externalRatingLogos: Readonly<Record<ExternalRatingLogo, string>> = {
  imdb,
  letterboxd,
  mal,
  tmdb,
  'tomatometer-certified': tomatometerCertified,
  'tomatometer-fresh': tomatometerFresh,
  'tomatometer-rotten': tomatometerRotten,
  'audience-certified': audienceCertified,
  'audience-spilled': audienceSpilled,
  'audience-upright': audienceUpright,
  metacritic,
  justwatch,
};
