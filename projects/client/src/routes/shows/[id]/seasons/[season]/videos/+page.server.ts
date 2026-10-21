import { loadVideos } from '../../../../../../lib/videos/loadVideos.ts';

export const load = ({ fetch, parent, params }) =>
  loadVideos({ fetch, parent, item: { type: 'season', id: params.id, season: params.season } });
