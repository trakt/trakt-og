import type { ProfileUser } from '../ProfileUser.ts';
import type { NetworkType } from './networkTypes.ts';

type Params = { profile: Pick<ProfileUser, 'displayName' | 'firstName'>; type: NetworkType };

/** A member's network page: "Justin Nemeth's followers". */
export function toNetworkSeo({ profile, type }: Params): { title: string; description: string } {
  return {
    title: `${profile.displayName}'s ${type === 'following_pending' ? 'following (pending)' : type}`,
    description: `Check out ${profile.firstName}'s network of friends and followers.`,
  };
}
