import { toLiveWatch } from './toLiveWatch.ts';
import type { SocialItem, SocialMember } from './toSocialItem.ts';
import type { SocialItemMedia } from './toSocialMedia.ts';

/** A followed member watching something right now. */
export type LiveWatch = SocialItemMedia & {
  readonly member: SocialMember;
  readonly kind: Extract<SocialItem['kind'], 'watch' | 'checkin'>;
  /** "That '70s Show 3x05". */
  readonly label: string;
  readonly startedAt: string;
  readonly expiresAt: string;
};

type FetchWatchingParams = {
  /** A GET against the API, through the browser's queue. */
  get: (path: string) => Promise<Response>;
  members: readonly SocialMember[];
};

async function watchingOf(get: FetchWatchingParams['get'], member: SocialMember): Promise<LiveWatch | null> {
  if (!member.slug) return null;

  const response = await get(`/users/${encodeURIComponent(member.slug)}/watching?extended=full,images`);
  // 204 is "not watching"; anything else that isn't a 200 counts as not watching too.
  if (response.status !== 200) return null;

  return toLiveWatch(await response.json().catch(() => null), member);
}

/** Who of `members` is watching something now. A member whose request fails is left out, not the whole answer. */
export async function fetchWatching({ get, members }: FetchWatchingParams): Promise<readonly LiveWatch[]> {
  const watching = await Promise.all(members.map((member) => watchingOf(get, member).catch(() => null)));
  return watching.filter((watch) => watch !== null);
}
