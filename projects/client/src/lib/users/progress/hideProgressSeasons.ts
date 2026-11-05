import { z } from 'zod/v4';
import type { ToastAction } from '../../components/toast/toast.svelte.ts';
import type { createOverlay } from '../../overlay/createOverlay.svelte.ts';
import type { HiddenProgress } from '../../overlay/HiddenProgress.ts';
import { GENERIC_ERROR } from '../../utils/genericError.ts';
import { seasonName } from '../../utils/seasonName.ts';

type Params = {
  show: { readonly id: number; readonly title: string };
  seasons: readonly number[];
  hide: boolean;
  overlay: Pick<ReturnType<typeof createOverlay>, 'patch'>;
  request: (path: string, body: unknown) => Promise<Response>;
  notify: { success: (message: string, action?: ToastAction) => void; error: (message: string) => void };
  now?: () => Date;
};

const resultSchema = z.object({
  added: z.object({ seasons: z.number() }).partial().optional(),
  deleted: z.object({ seasons: z.number() }).partial().optional(),
});

/** "Season 3", "Specials", or "4 seasons". */
const seasonsLabel = (seasons: readonly number[]) =>
  seasons.length === 1 ? seasonName(seasons[0] ?? 0) : `${seasons.length} seasons`;

function toggled(progress: HiddenProgress, show: number, seasons: readonly number[], hide: boolean): HiddenProgress {
  const current = new Set(progress.seasons.get(show));
  seasons.forEach((number) => (hide ? current.add(number) : current.delete(number)));
  const next = new Map(progress.seasons);
  if (current.size > 0) next.set(show, current);
  else next.delete(show);
  return { ...progress, seasons: next };
}

/**
 * Hides seasons of one show from the Watching progress (`progress_watched`), or brings them back. The overlay's hidden
 * seasons change at once, so the row's counts follow before the request lands, and roll back if it fails. A hide's
 * toast offers Undo.
 */
export async function hideProgressSeasons(params: Params): Promise<boolean> {
  const { show, seasons, hide, overlay, request, notify, now = () => new Date() } = params;
  if (seasons.length === 0) return false;

  const rollback = overlay.patch('progressHidden', (slices) => ({
    ...slices,
    watched: toggled(slices.watched, show.id, seasons, hide),
  }));
  const date = now().toISOString();
  const body = {
    shows: [
      { ids: { trakt: show.id }, seasons: seasons.map((number) => (hide ? { number, hidden_at: date } : { number })) },
    ],
  };

  try {
    const response = await request(`/users/hidden/progress_watched${hide ? '' : '/remove'}`, body);
    if (!response.ok) throw new Error(String(response.status));
    const result = resultSchema.parse(await response.json());
    if (!(hide ? result.added : result.deleted)?.seasons) throw new Error('Seasons were not updated');
  } catch (error) {
    rollback();
    if (!(error instanceof Error) || error.message !== '429') notify.error(GENERIC_ERROR);
    return false;
  }

  const label = seasonsLabel(seasons);
  if (hide) {
    notify.success(`You hid ${label} of ${show.title}.`, {
      label: 'Undo',
      run: () => void hideProgressSeasons({ ...params, hide: false }),
    });
  } else {
    notify.success(`${label} of ${show.title} ${seasons.length === 1 ? 'is' : 'are'} back on your progress.`);
  }
  return true;
}
