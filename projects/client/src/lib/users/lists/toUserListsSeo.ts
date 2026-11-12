import type { ProfileUser } from '../ProfileUser.ts';
import type { ListsMode } from './ListsMode.ts';

type Params = {
  profile: Pick<ProfileUser, 'displayName' | 'firstName'>;
  mode: ListsMode;
};

const MODE_NAMES = {
  personal: 'personal lists',
  smart: 'smart lists',
  collaborations: 'collaborations',
  liked: 'liked lists',
  'liked-official': 'liked official lists',
} as const;

/** A member's lists pages: "Justin Nemeth's liked lists". */
export function toUserListsSeo({ profile, mode }: Params): { title: string; description: string } {
  return {
    title: `${profile.displayName}'s ${MODE_NAMES[mode]}`,
    description: `Check out ${profile.firstName}'s watchlist and personal lists.`,
  };
}
