import { crewDepartments } from '../../credits/crewDepartments.ts';
import { countLabel } from '../../utils/countLabel.ts';
import { imageUrl } from '../../utils/imageUrl.ts';
import type { CastMember } from './CastMember.ts';

type CrewMember = {
  readonly person: {
    readonly name: string;
    readonly ids: { readonly slug: string };
    readonly gender?: string | null;
  };
  readonly jobs?: readonly string[] | null;
  readonly episode_count?: number | null;
  readonly images?: { readonly headshot: readonly string[] } | null;
};

/**
 * A summary's crew departments for the actors dropdown, in OG's order, with each person's jobs as the role line.
 * Shows and seasons pass `episodeCounts` for the episode pill.
 */
export function toCrewGroups(
  crew: Readonly<Partial<Record<string, readonly CrewMember[]>>> | null | undefined,
  episodeCounts: boolean,
): { id: string; label: string; cast: CastMember[] }[] {
  return crewDepartments(crew).map(({ id, label, members }) => ({
    id,
    label,
    cast: members.map((member) => ({
      name: member.person.name,
      href: `/people/${member.person.ids.slug}`,
      characters: (member.jobs ?? []).join(', '),
      image: imageUrl(member.images?.headshot.at(0), 'thumb'),
      gender: member.person.gender ?? undefined,
      episodes: episodeCounts && member.episode_count ? countLabel(member.episode_count, 'episode') : undefined,
    })),
  }));
}
