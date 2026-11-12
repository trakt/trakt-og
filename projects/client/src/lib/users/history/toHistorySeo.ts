import type { ProfileUser } from '../ProfileUser.ts';
import type { HistoryType } from './historyTypes.ts';

type Params = { profile: Pick<ProfileUser, 'displayName' | 'firstName'>; type: HistoryType };

/** A member's history page: "Justin Nemeth's movie watched history". */
export function toHistorySeo({ profile, type }: Params): { title: string; description: string } {
  const metaType = type === 'all' ? 'TV show and movie' : type.replace(/s$/, '');
  return {
    title: `${profile.displayName}'s ${metaType} watched history`,
    description: `Check out what ${profile.firstName} has been watching recently.`,
  };
}
