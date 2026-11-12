import type { ProfileUser } from '../ProfileUser.ts';
import type { noteTypes } from './noteTypes.ts';

type Params = { profile: Pick<ProfileUser, 'displayName' | 'firstName'>; type: keyof typeof noteTypes };

/** A member's notes page: "Justin Nemeth's library notes". */
export function toNotesSeo({ profile, type }: Params): { title: string; description: string } {
  const metaType =
    type === 'all'
      ? ''
      : `${type === 'collection' ? 'library' : type === 'people' ? 'person' : type.replace(/s$/, '')} `;
  return {
    title: `${profile.displayName}'s ${metaType}notes`,
    description: `Check out ${profile.firstName}'s recent notes.`,
  };
}
