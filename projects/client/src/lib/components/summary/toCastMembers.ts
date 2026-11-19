import type { PeopleResponse } from '@trakt/api';
import type { CastMember } from './CastMember.ts';

/** Cast names, characters and optional episode counts for movie, show, season and episode summaries. */
export function toCastMembers(members: PeopleResponse['cast'] | undefined, actorSpoilers: boolean): CastMember[] {
  return (members ?? []).map((member) => ({
    name: member.person.name,
    slug: member.person.ids.slug,
    id: member.person.ids.trakt,
    characters: (member.characters ?? []).join(', '),
    gender: member.person.gender ?? undefined,
    episodes: actorSpoilers ? (member.episode_count ?? 0) : 0,
  }));
}
