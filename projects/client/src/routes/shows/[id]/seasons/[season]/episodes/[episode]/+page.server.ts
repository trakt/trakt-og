import { loadEpisode } from '../../../../../../../lib/shows/loadEpisode.ts';

export const load = ({ fetch, locals, parent, params, url }) =>
  loadEpisode({
    fetch,
    token: locals.token,
    parent,
    id: params.id,
    season: params.season,
    episode: params.episode,
    url,
  });
