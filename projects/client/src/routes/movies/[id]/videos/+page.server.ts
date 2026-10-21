import { loadVideos } from '../../../../lib/videos/loadVideos.ts';

export const load = ({ fetch, parent, params }) =>
  loadVideos({ fetch, parent, item: { type: 'movie', id: params.id } });
