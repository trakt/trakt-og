import { api } from '../api/api.ts';
import type { OnDeckItem } from '../components/media/OnDeckItem.ts';
import { toOnDeckItem } from '../progress/toOnDeckItem.ts';
import type { UpNextEntry } from '../progress/UpNextEntry.ts';
import { extractPageMeta } from '../api/extractPageMeta.ts';
import type { DashboardSettings } from './DashboardSettings.ts';
import { fetchSeasonPosters } from './fetchSeasonPosters.ts';
import { fetchUpNextTicks } from './fetchUpNext.ts';
import { fetchWholeShowProgress } from './fetchWholeShowProgress.ts';
import { toDashboardSettings } from './toDashboardSettings.ts';
import { capitalize } from '../utils/capitalize.ts';

async function findEntry(client: ReturnType<typeof api>, id: number, page = 1): Promise<UpNextEntry | undefined> {
  const response = await client.sync.progress.upNext.nitro({
    query: { intent: 'all', limit: 250, page, sort_by: 'default', sort_how: 'desc' },
  });
  if (response.status !== 200) throw new Error('Could not refresh this show');
  const entry = response.body.find(({ show }) => show.ids.trakt === id);
  if (entry) return entry;
  const meta = extractPageMeta(response.headers);
  const more = meta.type === 'paginated' ? page < meta.total : response.body.length === 250;
  return more ? findEntry(client, id, page + 1) : undefined;
}

/**
 * Up Next respects rewatch resets; per-show watched progress supplies a rewatch's whole show, as the panel does, and
 * completed shows. The default sort puts the show just watched first, so the scan rarely reads past the first page.
 */
export async function fetchOnDeckItem({
  item,
  username,
  fetch,
  settings = toDashboardSettings({ settings: null }).upNext,
}: {
  item: OnDeckItem;
  username: string;
  fetch: typeof globalThis.fetch;
  settings?: DashboardSettings['upNext'];
}): Promise<OnDeckItem> {
  const client = api({ fetch });
  const entry = await findEntry(client, item.showId);
  if (entry) {
    const season = entry.progress.next_episode?.season;
    const [lifetime, ticks, posterFor] = await Promise.all([
      entry.progress.reset_at ? fetchWholeShowProgress(client, item.showId) : undefined,
      settings.simpleProgress ? undefined : fetchUpNextTicks(client, entry),
      settings.poster === 'season' && season !== undefined
        ? fetchSeasonPosters({ fetch: globalThis.fetch, episodes: [{ showId: item.showId, season }] })
        : undefined,
    ]);
    const mapped = toOnDeckItem({
      entry,
      lifetime,
      username,
      ticks,
      seasonPoster: season === undefined ? undefined : posterFor?.(item.showId, season),
    });
    if (mapped) return mapped;
    throw new Error('Up Next returned no episode');
  }
  const [summary, progress] = await Promise.all([
    api().shows.summary({ params: { id: String(item.showId) }, query: { extended: 'full,images' } }),
    client.shows.progress.watched({ params: { id: String(item.showId) }, query: { extended: 'full' } }),
  ]);
  if (summary.status !== 200 || progress.status !== 200) throw new Error('Could not refresh this show');
  // Missing from Up Next can also mean hidden/filtered. Never turn a partial show into a false completed card.
  if (progress.body.completed < progress.body.aired) throw new Error('Show is no longer in Up Next');
  const status = summary.body.status;
  return {
    ...item,
    complete: true,
    ticks: settings.simpleProgress ? undefined : Array.from({ length: progress.body.aired }, () => true),
    completionLabel: status === 'ended' || status === 'canceled' ? capitalize(status) : 'Returns next season!',
    progress: {
      aired: progress.body.aired,
      completed: progress.body.aired,
      plays: progress.body.stats?.play_count ?? 0,
    },
    rewatching: !!progress.body.reset_at,
  };
}
