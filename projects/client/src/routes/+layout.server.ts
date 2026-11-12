import { edgeCache } from '../lib/utils/edgeCache.ts';
import { loadPromotions } from '../lib/promotions/loadPromotions.ts';
import { loadViewerSession } from '../lib/settings/loadViewerSession.ts';

export const load = async (event) => {
  const [session, promotions] = await Promise.all([
    loadViewerSession(event),
    loadPromotions({ fetch: event.fetch, cache: edgeCache(), origin: new URL(event.request.url).origin }),
  ]);
  return { ...session, promotions };
};
