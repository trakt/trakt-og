import { z } from 'zod/v4';
import { api } from '../../api/api.ts';

const failed = "Doh! You can't like this list.";
const messageSchema = z.object({ message: z.string().optional() });

function writeLike(fetch: typeof globalThis.fetch, { id, ownerSlug, liked }: {
  id: number;
  ownerSlug?: string;
  liked: boolean;
}) {
  const client = api({ fetch });
  if (ownerSlug) {
    const params = { id: encodeURIComponent(ownerSlug), list_id: String(id) };
    return liked ? client.users.lists.list.like({ params }) : client.users.lists.list.unlike({ params });
  }
  const params = { id: String(id) };
  return liked ? client.lists.like({ params }) : client.lists.unlike({ params });
}

/** Liking changes list state, not media membership. The calling control owns the optimistic patch and rollback. */
export async function changeListLike({
  fetch,
  id,
  ownerSlug,
  liked,
  patch,
  notify,
}: {
  fetch: typeof globalThis.fetch;
  id: number;
  ownerSlug?: string;
  liked: boolean;
  patch: () => () => void;
  notify: (message: string) => void;
}): Promise<boolean> {
  const rollback = patch();
  try {
    const response = await writeLike(fetch, { id, ownerSlug, liked });
    const body = response.body === undefined || response.body instanceof Blob
      ? null
      : messageSchema.parse(response.body);
    if (response.status < 200 || response.status >= 300) {
      rollback();
      notify(body?.message ?? failed);
      return false;
    }
    return true;
  } catch {
    rollback();
    notify(failed);
    return false;
  }
}
