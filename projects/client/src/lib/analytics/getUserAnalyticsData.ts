import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';

type UserAnalyticsData = {
  user_type: 'anonymous' | 'standard' | 'vip';
};

// No join timestamp: a millisecond-precision date is near-unique per account,
// which would make it a stable cross-session key.
export function getUserAnalyticsData(user: HeaderUser | null): UserAnalyticsData {
  if (!user) return { user_type: 'anonymous' };

  return { user_type: user.isVip ? 'vip' : 'standard' };
}
