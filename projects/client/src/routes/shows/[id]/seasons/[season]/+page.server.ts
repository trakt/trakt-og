import { loadSeason } from '../../../../../lib/shows/loadSeason.ts';

export const load = ({ fetch, locals, parent, params, url, cookies }) =>
  loadSeason({ fetch, token: locals.token, parent, id: params.id, season: params.season, url, cookies });
