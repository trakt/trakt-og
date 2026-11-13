import type { PeopleResponse } from '@trakt/api';
import { countLabel } from '../../utils/countLabel.ts';
import { castHeadshot } from '../../images/castHeadshot.ts';
import type { CastMember } from './CastMember.ts';

type Member = NonNullable<PeopleResponse['cast']>[number] & { readonly character_image?: string | null };

/** Cast headshots, names and optional episode counts for show, season and episode summaries. */
export function toCastMembers(members: readonly Member[] | null | undefined, actorSpoilers: boolean): CastMember[] {
  return (members ?? []).map((member) => ({
    name: member.person.name,
    href: `/people/${member.person.ids.slug}`,
    characters: (member.characters ?? []).join(', '),
    image: castHeadshot(member),
    gender: member.person.gender ?? undefined,
    episodes: actorSpoilers && member.episode_count ? countLabel(member.episode_count, 'episode') : '',
  }));
}
