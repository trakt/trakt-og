import { crewDepartments } from '../../credits/crewDepartments.ts';
import type { CastMember } from './CastMember.ts';

type CrewMember = {
  readonly person: {
    readonly name: string;
    readonly ids: { readonly trakt: number; readonly slug: string };
    readonly gender?: string | null;
  };
  readonly jobs?: readonly string[] | null;
  readonly episode_count?: number | null;
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
      slug: member.person.ids.slug,
      id: member.person.ids.trakt,
      characters: (member.jobs ?? []).join(', '),
      gender: member.person.gender ?? undefined,
      episodes: episodeCounts ? (member.episode_count ?? 0) : 0,
    })),
  }));
}
