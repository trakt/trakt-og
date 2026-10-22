import { authenticatedFetch } from './authenticatedFetch.ts';
import { userManager } from './userManager.ts';

/** The browser's signed-in fetch: the stored user's token, renewed and retried once on a 401. */
export const viewerFetch = () => authenticatedFetch({ manager: userManager() });
