import { z } from 'zod/v4';
import type { createOverlay } from '../../overlay/createOverlay.svelte.ts';
import type { VisibilityTarget } from './VisibilityTarget.ts';
import { GENERIC_ERROR } from '../../utils/genericError.ts';

type Params = {
  target: VisibilityTarget;
  action: 'rewatch' | 'unrewatch' | 'drop' | 'restore' | 'hide';
  section?: 'calendar' | 'recommendations' | 'progress_watched' | 'progress_collected';
  at?: string;
  overlay: Pick<ReturnType<typeof createOverlay>, 'patch'>;
  request: (path: string, body: unknown, method: 'POST' | 'DELETE') => Promise<Response>;
  notify: { success: (message: string) => void; error: (message: string) => void };
  now?: () => Date;
};
const resultSchema = z.object({
  added: z.record(z.string(), z.number()).optional(),
  deleted: z.record(z.string(), z.number()).optional(),
  not_found: z.record(z.string(), z.array(z.unknown())).optional(),
});
const resetSchema = z.object({ reset_at: z.iso.datetime({ offset: true }) });

/** Apply each write immediately across cards and summaries; undo all patches on any rejected response. */
export async function changeVisibility({
  target,
  action,
  section,
  at,
  overlay,
  request,
  notify,
  now = () => new Date(),
}: Params) {
  if (action !== 'hide' && target.type !== 'show') return false;
  if (action === 'hide' && !section) return false;
  const date = at ?? now().toISOString();
  const patchDates = (slice: 'rewatching' | 'dropped', remove = false) =>
    overlay.patch(
      slice,
      (values) => {
        const next = new Map([...values.keys()].map((id) => [id, values instanceof Map ? (values.get(id) ?? '') : '']));
        if (remove) next.delete(target.id);
        else next.set(target.id, date);
        return next;
      },
      new Map(),
    );
  // A season known only by its number has no id for the `hidden` slice; its page removes the row itself.
  const rollbacks =
    action === 'rewatch'
      ? [patchDates('rewatching'), patchDates('dropped', true)]
      : action === 'unrewatch'
        ? [patchDates('rewatching', true)]
        : action === 'hide' && target.season
          ? []
          : action === 'hide'
            ? [
                overlay.patch(
                  'hidden',
                  (hidden) =>
                    new Map(hidden).set(
                      section ?? '',
                      new Set([...(hidden.get(section ?? '') ?? []), `${target.type}:${target.id}`]),
                    ),
                  new Map(),
                ),
              ]
            : [patchDates('dropped', action === 'restore')];
  // Undoing a rewatch deletes the reset, so the plays before it count again.
  const path =
    action === 'rewatch' || action === 'unrewatch'
      ? `/shows/${target.id}/progress/watched/reset`
      : `/users/hidden/${action === 'hide' ? section : 'dropped'}${action === 'restore' ? '/remove' : ''}`;
  const stamp = action === 'restore' ? {} : { hidden_at: date };
  const body =
    action === 'rewatch'
      ? { reset_at: date }
      : action === 'unrewatch'
        ? undefined
        : target.season
          ? { shows: [{ ids: { trakt: target.season.show }, seasons: [{ number: target.season.number, ...stamp }] }] }
          : { [`${target.type}s`]: [{ ids: { trakt: target.id }, ...stamp }] };
  try {
    const response = await request(path, body, action === 'unrewatch' ? 'DELETE' : 'POST');
    if (!response.ok) throw new Error(String(response.status));
    if (action === 'rewatch') resetSchema.parse(await response.json());
    else if (action !== 'unrewatch') {
      const result = resultSchema.parse(await response.json());
      if (Object.values(result.not_found ?? {}).some((items) => items.length > 0)) throw new Error('Item not found');
      const counts = action === 'restore' ? result.deleted : result.added;
      if (!counts?.[`${target.type}s`]) throw new Error('Item was not updated');
    }
  } catch (error) {
    rollbacks.toReversed().forEach((rollback) => rollback());
    if (!(error instanceof Error) || error.message !== '429') notify.error(GENERIC_ERROR);
    return false;
  }
  notify.success(
    action === 'rewatch'
      ? `You reset the watched progress for ${target.title}.`
      : action === 'unrewatch'
        ? `You stopped rewatching ${target.title}.`
        : action === 'restore'
          ? `You undropped ${target.title}.`
          : action === 'drop'
            ? `You dropped ${target.title}.`
            : `You hid ${target.title}.`,
  );
  return true;
}
