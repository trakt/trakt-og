import type { UserStatsResponse } from '@trakt/api';
import type { ProfileUser } from '../../ProfileUser.ts';

/**
 * What the profile frame has loaded before the page's own requests finish. A box's extra request decides from this
 * alone whether to fire, so it can run alongside the page's reads instead of after them.
 */
export type BoxFrame = {
  readonly profile: ProfileUser;
  readonly stats: UserStatsResponse;
  readonly isSelf: boolean;
};
