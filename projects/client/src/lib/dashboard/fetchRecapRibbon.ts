import type { api } from '../api/api.ts';
import type { RecapRibbon } from './RecapRibbon.ts';
import { recapWindows } from './recapWindows.ts';
import { toRecapRibbon } from './toRecapRibbon.ts';
import { dayIn } from '../utils/dayIn.ts';

type FetchRecapRibbonParams = {
  client: ReturnType<typeof api>;
  slug: string;
  timeZone: string;
  now?: Date;
};

/**
 * The dashboard's recap strip, with the viewer's plays in each month of the year so far. The API has no per-month
 * count (Year in Review is one total, and a Month in Review per month is a heavy read), so each month is a one-row
 * history page and its `X-Pagination-Item-Count`, all together. A month that fails fails the strip, since a gap would
 * read as a month with nothing watched.
 */
export async function fetchRecapRibbon({
  client,
  slug,
  timeZone,
  now = new Date(),
}: FetchRecapRibbonParams): Promise<RecapRibbon> {
  const responses = await Promise.all(
    recapWindows({ now, timeZone }).map(({ start, end }) =>
      client.users.history.all({ params: { id: 'me' }, query: { start_at: start, end_at: end, limit: 1 } }),
    ),
  );
  if (responses.some(({ status }) => status !== 200)) throw new Error('A month of history did not load');

  const plays = responses.map(({ headers }) => Number(headers.get('x-pagination-item-count')) || 0);
  return toRecapRibbon({ today: dayIn(now.toISOString(), timeZone), plays, slug });
}
