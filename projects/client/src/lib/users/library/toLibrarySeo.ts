import type { HistoryType } from '../history/historyTypes.ts';
import type { ProfileUser } from '../ProfileUser.ts';

type Params = { profile: Pick<ProfileUser, 'displayName' | 'firstName'>; type: HistoryType };

/** A member's library page: "Justin Nemeth's movie library". */
export function toLibrarySeo({ profile, type }: Params): { title: string; description: string } {
  const metaType = type === 'all' ? 'show and movie' : type.replace(/s$/, '');
  return {
    title: `${profile.displayName}'s ${metaType} library`,
    description: `Check out what ${profile.firstName} has added to their library recently.`,
  };
}
