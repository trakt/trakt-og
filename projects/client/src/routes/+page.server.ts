import { redirect } from '@sveltejs/kit';
import { loadHomePage } from '../lib/home/loadHomePage.ts';

/**
 * `/`: the home page, or the dashboard once signed in. Only a session that loaded its user goes to the dashboard,
 * since the dashboard sends an expired or refused token back here.
 */
export const load = async (event) => {
  if ((await event.parent()).user) redirect(302, '/dashboard');
  return loadHomePage(event);
};
