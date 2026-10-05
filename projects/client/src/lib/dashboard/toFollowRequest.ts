import type { z } from 'zod/v4';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { toProfileUser } from '../users/toProfileUser.ts';
import { formatDate } from '../utils/formatDate.ts';
import { relativeDate } from '../utils/relativeDate.ts';
import type { followRequestsSchema } from './followRequestsSchema.ts';

type Params = { datePreferences: DatePreferences; now: Date };

export function toFollowRequest(row: z.infer<typeof followRequestsSchema>[number], { datePreferences, now }: Params) {
  const user = toProfileUser(row.user);
  return {
    id: row.id,
    slug: user.slug,
    name: user.displayName,
    avatarUrl: user.avatarUrl,
    requestedAt: formatDate(row.requested_at, { ...datePreferences, time: true }),
    requestedIso: row.requested_at,
    requestedAgo: relativeDate(row.requested_at, now),
  };
}
