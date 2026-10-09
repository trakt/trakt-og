import { loadHome } from '../../lib/home/loadHome.ts';

export const load = ({ fetch, parent }) => loadHome({ fetch, parent, now: Date.now(), random: Math.random });
