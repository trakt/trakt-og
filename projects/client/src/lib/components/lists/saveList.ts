import { z } from 'zod/v4';
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import type { ListDraft } from './ListDraft.ts';
import { editableListSchema } from './editableListSchema.ts';
import { ListWriteError } from './ListWriteError.ts';
import { collaboratorsSchema } from '../../users/lists/collaboratorsSchema.ts';
import { isApiUnavailable } from '../../api/isApiUnavailable.ts';

const { track: trackCollaborator } = useTrack(AnalyticsEvent.ListCollaborator);
const COLLABORATORS_UNAVAILABLE = "Collaborators aren't available with this API key. Your list was saved.";

/**
 * Metadata is saved once. A partial collaborator failure keeps its id for a safe retry. A client ID that may not call
 * the Official-only collaborator route saves without them, and only says so when some were picked.
 */
export async function saveList({
  request,
  draft,
  id,
}: {
  request: (path: string, method: string, body?: unknown) => Promise<Response>;
  draft: ListDraft;
  id?: number;
}) {
  const { collaborators, name, privacy, ...preferences } = draft;
  useTrack(id === undefined ? AnalyticsEvent.ListCreate : AnalyticsEvent.ListEdit).track();
  const response = await request(
    `/users/me/lists${id === undefined ? '' : `/${id}`}`,
    id === undefined ? 'POST' : 'PUT',
    { ...preferences, name: name.trim(), privacy },
  );
  if (!response.ok) throw await ListWriteError.from(response);
  const list = editableListSchema.parse(await response.json());
  try {
    const read = await request(`/lists/${list.ids.trakt}/collaborators`, 'GET');
    if (isApiUnavailable(read)) {
      return { list, collaboratorError: collaborators.length > 0 ? COLLABORATORS_UNAVAILABLE : '' };
    }
    if (!read.ok) throw await ListWriteError.from(read);
    const current = collaboratorsSchema.parse(await read.json()).map((user) => user.ids.slug ?? user.username);
    const changes = [
      ...current.filter((slug) => !collaborators.includes(slug)).map((slug) => ({ slug, method: 'DELETE' })),
      ...collaborators.filter((slug) => !current.includes(slug)).map((slug) => ({ slug, method: 'POST' })),
    ];
    // Remove first, so replacing someone at the ten-person limit works.
    for (const { slug, method } of changes) {
      const result = await request(`/lists/${list.ids.trakt}/collaborators/${encodeURIComponent(slug)}`, method);
      if (result.status === 420 && method === 'POST') trackCollaborator({ action: 'limit-reached' });
      if (!result.ok) throw await ListWriteError.from(result);
      trackCollaborator({ action: method === 'POST' ? 'add' : 'remove' });
      if (result.status !== 204) z.object({}).parse(await result.json());
    }
    return { list, collaboratorError: '' };
  } catch (cause) {
    const message =
      cause instanceof ListWriteError && cause.status === 420
        ? 'A list can have at most 10 collaborators.'
        : 'Could not update collaborators. They must follow you. Your list was saved; retry to finish.';
    return { list, collaboratorError: message };
  }
}
