import type { CachedShow } from '../../shows/cache/CachedShow.ts';

/**
 * A show's minutes an episode, for estimates. Some shows have no runtime on Trakt (0) while their episodes do, so their
 * total runtime spread over the aired episodes stands in.
 */
export function episodeRuntime({
  runtime,
  totalRuntime,
  airedEpisodes,
}: Pick<CachedShow, 'runtime' | 'totalRuntime' | 'airedEpisodes'>): number {
  if (runtime) return runtime;
  return totalRuntime && airedEpisodes ? totalRuntime / airedEpisodes : 0;
}
