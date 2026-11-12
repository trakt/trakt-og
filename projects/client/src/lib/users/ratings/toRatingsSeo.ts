import type { ProfileUser } from '../ProfileUser.ts';
import type { ratingTypes } from './ratingTypes.ts';

type Params = { profile: Pick<ProfileUser, 'displayName' | 'firstName'>; type: keyof typeof ratingTypes };

/** A member's ratings page: "Justin Nemeth's movie ratings". */
export function toRatingsSeo({ profile, type }: Params): { title: string; description: string } {
  return {
    title: `${profile.displayName}'s ${type === 'all' ? '' : type.replace(/s$/, '') + ' '}ratings`,
    description: `Check out what ${profile.firstName} has been rating recently.`,
  };
}
