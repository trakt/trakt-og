import type { PeopleResponse } from '@trakt/api';
import { countLabel } from '../../utils/countLabel.ts';
import { castHeadshot } from '../../images/castHeadshot.ts';
import type { CastMember } from './CastMember.ts';

/**
 * Cast headshots, names and optional episode counts for movie, show, season and episode summaries. A show's Trakt id
 * shows each actor in character where there's a photo of it.
 */
export function toCastMembers(
  members: PeopleResponse['cast'] | undefined,
  actorSpoilers: boolean,
  showId?: number,
): CastMember[] {
  return (members ?? []).map((member) => ({
    name: member.person.name,
    href: `/people/${member.person.ids.slug}`,
    characters: (member.characters ?? []).join(', '),
    image: castHeadshot(member.person.ids.trakt, showId),
    gender: member.person.gender ?? undefined,
    episodes: actorSpoilers && member.episode_count ? countLabel(member.episode_count, 'episode') : '',
  }));
}
