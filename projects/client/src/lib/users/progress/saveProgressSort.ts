import { saveSettings, type SettingsRequest } from '../../settings/saveSettings.ts';
import { isSortBy, type ProgressSort } from './progressSort.ts';

type SaveProgressSortParams = {
  sort: Pick<ProgressSort, 'by' | 'how'>;
  request: SettingsRequest;
  notify: { error: (message: string) => void };
};

/**
 * Keeps the sort you pick as your watched progress sort (`browsing.progress.watched.sort`), which every tab reads
 * when its URL names none. The page has already moved to the sort's URL, so a failed save only shows its error.
 * An old sort name OG still took isn't saved. Resolves whether it saved.
 */
export async function saveProgressSort({ sort, request, notify }: SaveProgressSortParams): Promise<boolean> {
  if (!isSortBy(sort.by)) return false;
  const result = await saveSettings({
    request,
    body: { browsing: { progress: { watched: { sort: sort.by, sort_how: sort.how } } } },
  });
  result.errors.forEach((message) => notify.error(message));
  return result.saved;
}
