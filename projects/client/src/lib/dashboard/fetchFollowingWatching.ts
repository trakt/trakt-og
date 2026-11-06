import { z } from 'zod/v4';
import type { LiveWatch } from './fetchWatching.ts';
import { socialMemberSchema } from './socialMemberSchema.ts';
import { toLiveWatch } from './toLiveWatch.ts';
import { toSocialMember } from './toSocialMember.ts';

type FetchFollowingWatchingParams = {
  /** A GET against the API with the viewer's token. */
  get: (path: string) => Promise<Response>;
};

const rowsSchema = z.array(z.unknown());
const rowUserSchema = z.object({ user: socialMemberSchema });

/**
 * Everyone the viewer follows who is watching something now, in one call to the v3 route. A row this app can't show
 * is left out, not the whole answer; a failed call throws.
 */
export async function fetchFollowingWatching({ get }: FetchFollowingWatchingParams): Promise<readonly LiveWatch[]> {
  const response = await get('/v3/users/me/following/watching?extended=full,images');
  if (response.status !== 200) throw new Error(`Following watching failed with ${response.status}`);

  const rows = rowsSchema.safeParse(await response.json().catch(() => null));
  if (!rows.success) throw new Error('Following watching returned an invalid list');

  return rows.data.flatMap((row) => {
    const user = rowUserSchema.safeParse(row);
    const watch = user.success ? toLiveWatch(row, toSocialMember(user.data.user)) : null;
    return watch ? [watch] : [];
  });
}
