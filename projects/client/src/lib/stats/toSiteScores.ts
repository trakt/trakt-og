import type { ExternalRating, ExternalRatingLogo } from '../components/summary/ExternalRating.ts';

/** Whose primary color a site's bar takes. */
type SiteBrand = 'imdb' | 'letterboxd' | 'tmdb' | 'rotten-tomatoes' | 'metacritic';

const BRANDS: Readonly<Partial<Record<ExternalRatingLogo, SiteBrand>>> = {
  imdb: 'imdb',
  letterboxd: 'letterboxd',
  tmdb: 'tmdb',
  'tomatometer-certified': 'rotten-tomatoes',
  'tomatometer-fresh': 'rotten-tomatoes',
  'tomatometer-rotten': 'rotten-tomatoes',
  'audience-certified': 'rotten-tomatoes',
  'audience-spilled': 'rotten-tomatoes',
  'audience-upright': 'rotten-tomatoes',
  metacritic: 'metacritic',
};

function diffOf(score: number, trakt: number) {
  const diff = score - trakt;
  if (diff === 0) return { text: '0', trend: 'flat' as const, label: 'same as Trakt' };
  const points = `${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'point' : 'points'}`;
  return diff > 0
    ? { text: `+${diff}`, trend: 'up' as const, label: `${points} above Trakt` }
    : { text: `−${Math.abs(diff)}`, trend: 'down' as const, label: `${points} below Trakt` };
}

/**
 * The stats page's Second Opinions rows: each external rating with a score, on the 100 point scale, with how far it sits
 * from Trakt's percent. JustWatch's rank isn't a score, so it stays in the strip.
 */
export function toSiteScores({ external, trakt }: { external: readonly ExternalRating[]; trakt: number }) {
  return external.flatMap((site) => {
    const brand = BRANDS[site.logo];
    if (site.score === undefined || !brand) return [];
    return [{ ...site, score: site.score, brand, diff: diffOf(site.score, trakt) }];
  });
}
