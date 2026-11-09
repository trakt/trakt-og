import { z } from 'zod/v4';
import { userAvatar } from '../../images/userAvatar.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
const schema = z.array(
  z.object({
    user: z.object({
      username: z.string(),
      name: z.string().nullish(),
      ids: z.object({ trakt: z.number().nullish(), slug: z.string().nullish() }),
    }),
  }),
);
/** The native contract omits limit; use its supported limit=all rather than dropping followers after page one. */
export async function loadFollowerCandidates(fetch: typeof globalThis.fetch) {
  const response = await rawApiFetch({ fetch, path: '/users/me/followers?limit=all&extended=full' });
  if (!response.ok) throw new Error('Could not load followers');
  return schema.parse(await response.json()).map(({ user }) => ({
    slug: user.ids.slug ?? user.username,
    name: user.name ? `${user.name} (@${user.ids.slug ?? user.username})` : `@${user.ids.slug ?? user.username}`,
    avatar: user.ids.trakt ? userAvatar(user.ids.trakt) : undefined,
  }));
}
