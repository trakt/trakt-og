import { apiQueue } from '../api/apiQueue.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { SiteLine } from '../components/stats/SiteLine.ts';
import { ratingPercent } from '../utils/ratingPercent.ts';
import { episodeSiteRatingsSchema } from './episodeSiteRatingsSchema.ts';

type Params = {
  /** The show's id or slug. */
  show: string;
  season: number;
  episodes: readonly number[];
};

const percentOf = (rating: number | null | undefined) => (rating ? ratingPercent(rating) : null);

type Site = { rating?: number | null; votes?: number | null } | null | undefined;

const lineOf = (sites: readonly Site[]): SiteLine => ({
  percents: sites.map((site) => percentOf(site?.rating)),
  votes: sites.map((site) => (site?.rating ? (site.votes ?? null) : null)),
});

async function readEpisode({ show, season, episode }: { show: string; season: number; episode: number }) {
  const path = `/shows/${encodeURIComponent(show)}/seasons/${season}/episodes/${episode}/ratings?extended=all`;
  const response = await apiQueue.run(() => rawApiFetch({ path })).catch(() => null);
  if (response?.status !== 200) return null;
  const parsed = episodeSiteRatingsSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data : null;
}

/**
 * Each episode's IMDb and TMDB ratings as percents with their votes, in the order of `episodes`, read in the browser through the API
 * queue and without the viewer's token. An episode whose read fails, or that a site hasn't rated, is a null: a gap.
 */
export async function fetchEpisodeSiteRatings({ show, season, episodes }: Params) {
  const reads = await Promise.all(episodes.map((episode) => readEpisode({ show, season, episode })));
  return { imdb: lineOf(reads.map((read) => read?.imdb)), tmdb: lineOf(reads.map((read) => read?.tmdb)) };
}
