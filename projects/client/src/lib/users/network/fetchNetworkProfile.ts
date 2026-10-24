import type { SocialGet } from '../../dashboard/fetchSocialFeed.ts';
import { profileResponseSchema } from '../profileResponseSchema.ts';
import type { ProfileUser } from '../ProfileUser.ts';
import { toProfileUser } from '../toProfileUser.ts';

/**
 * A network card's user from their own profile: the following and followers lists leave out the VIP cover and the
 * OG and years on the VIP label. Null when the profile doesn't answer.
 */
export async function fetchNetworkProfile({
  get,
  slug,
}: {
  get: SocialGet;
  slug: string;
}): Promise<ProfileUser | null> {
  const response = await get(`/users/${encodeURIComponent(slug)}?extended=full,vip`);
  if (response.status !== 200) return null;

  const parsed = profileResponseSchema.safeParse(await response.json().catch(() => null));
  return parsed.success ? toProfileUser(parsed.data) : null;
}
