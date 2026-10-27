import { loadBuiltInList } from '../../../../../lib/lists/loadBuiltInList.ts';
export const load = (event: Omit<Parameters<typeof loadBuiltInList>[0], 'kind'>) =>
  loadBuiltInList({ ...event, kind: 'watchlist' });
