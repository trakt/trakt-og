import { loadHome } from '../../lib/home/loadHome.ts';

export const load = (event) => {
  event.depends('trakt:home');
  return loadHome({ ...event, liveFetch: globalThis.fetch, now: Date.now(), random: Math.random });
};
