import type { ProfileUser } from './ProfileUser.ts';

/**
 * How a profile tab reads, from the frame's profile, which was read with the viewer's token: nothing when it's locked,
 * with the token when it's private and the viewer may see it (their own, or one they follow), and without it when
 * it's public.
 */
export function profileAccess({ isPrivate, isLocked }: Pick<ProfileUser, 'isPrivate' | 'isLocked'>) {
  if (isLocked) return 'none';
  return isPrivate ? 'viewer' : 'anonymous';
}
