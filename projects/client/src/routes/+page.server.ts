import { loadComingSoon } from '../lib/coming-soon/loadComingSoon.ts';

export const load = ({ cookies, url }) => loadComingSoon({ cookies, url, roll: Math.random() });
