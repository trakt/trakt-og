import { error } from '@sveltejs/kit';
import { type VideoResponse, videoResponseSchema } from '@trakt/api';
import { contractSchema } from '../api/contractSchema.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { loadSubpageMedia } from '../subpage/loadSubpageMedia.ts';
import { subpageApiPath } from '../subpage/subpageApiPath.ts';
import { toVideoCards } from './toVideoCards.ts';

type Params = Omit<Parameters<typeof loadSubpageMedia>[0], 'suffix'>;

async function readVideos(fetch: typeof globalThis.fetch, path: string): Promise<readonly VideoResponse[]> {
  const response = await rawApiFetch({ fetch, path: `${path}/videos` });
  // The item's own 404 comes from the summary read.
  if (response.status === 404) return [];
  if (!response.ok) error(502, 'The Trakt API could not load the videos.');
  const videos = contractSchema(videoResponseSchema.array()).safeParse(await response.json().catch(() => null));
  if (!videos.success) error(502, 'The Trakt API returned invalid video data.');
  return videos.data;
}

/** `/movies/:id/videos`, `/shows/:id/videos` and the season and episode ones: every video that plays in the popup. */
export async function loadVideos({ fetch, parent, item }: Params) {
  const [subpage, videos] = await Promise.all([
    loadSubpageMedia({ fetch, parent, item, suffix: 'videos' }),
    readVideos(fetch, subpageApiPath(item)),
  ]);
  return { ...subpage, videos: toVideoCards(videos) };
}
