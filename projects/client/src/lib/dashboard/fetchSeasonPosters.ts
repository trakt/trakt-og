import { api } from '../api/api.ts';
import { mediaImage } from '../images/mediaImage.ts';

type FetchSeasonPostersParams = {
  fetch: typeof globalThis.fetch;
  /** Each episode's show and season. */
  episodes: readonly { readonly showId: number; readonly season: number }[];
};

export type SeasonPoster = (showId: number, season: number) => string | undefined;

const key = (showId: number, season: number) => `${showId}-${season}`;

/**
 * The season posters for OG's "Season" poster setting (`item_poster` with `use_season`): one public, cacheable
 * `/shows/:id/seasons` per show for the seasons' Trakt ids, which also covers specials without a season 0 path param.
 * A season's poster falls back to its show's. A show that fails is left out, so its card keeps the show poster.
 */
export async function fetchSeasonPosters({ fetch, episodes }: FetchSeasonPostersParams): Promise<SeasonPoster> {
  const client = api({ fetch });
  const showIds = [...new Set(episodes.map(({ showId }) => showId))];
  const perShow = await Promise.all(
    showIds.map(async (showId) => {
      const response = await client.shows.seasons({ params: { id: String(showId) }, query: {} }).catch(() => null);
      if (response?.status !== 200) return [];

      return response.body.map((season): [string, string] => [
        key(showId, season.number),
        mediaImage({
          type: 'season',
          id: season.ids.trakt,
          slot: 'poster',
          size: 'thumb',
          fallback: mediaImage({ type: 'show', id: showId, slot: 'poster', size: 'thumb' }),
        }),
      ]);
    }),
  );

  const posters = new Map(perShow.flat());
  return (showId, season) => posters.get(key(showId, season));
}
