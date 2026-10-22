import type { z } from 'zod/v4';
import type { seasonPeopleSchema } from '../shows/seasonPeopleSchema.ts';
import { countLabel } from '../utils/countLabel.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import { crewDepartments } from './crewDepartments.ts';
import { parameterize } from '../utils/parameterize.ts';

type People = z.infer<typeof seasonPeopleSchema>;
type Member = NonNullable<People['cast']>[number];

/** One headshot card in a credits grid. */
export type CreditPerson = {
  readonly id: number;
  readonly name: string;
  readonly href: string;
  readonly image?: string;
  /** Picks the silhouette when there's no headshot. */
  readonly gender?: string;
  /** The characters or the jobs, joined: "Walter White, Heisenberg". */
  readonly role: string;
  /** Shows and seasons: "62 episodes". */
  readonly episodes?: string;
  /** The same count as a number, for sorting. */
  readonly episodeCount?: number;
};

/** A credits dropdown group: "Season Regulars 8", "Directing 3". */
export type CreditGroup = {
  readonly id: string;
  readonly label: string;
  readonly count: string;
  readonly people: readonly CreditPerson[];
};

type Params = {
  /** The actor tabs in OG's order, e.g. Season Regulars then Guest Stars. */
  actors: readonly { readonly label: string; readonly members: readonly Member[] | null | undefined }[];
  crew: People['crew'];
  /** Episodes and movies have no episode counts. */
  episodeCounts: boolean;
};

function group(
  label: string,
  members: readonly Member[],
  role: (member: Member) => readonly string[],
  counts: boolean,
) {
  return {
    id: parameterize(label),
    label,
    count: members.length.toLocaleString('en-US'),
    people: members.map((member) => ({
      id: member.person.ids.trakt,
      name: member.person.name,
      href: `/people/${member.person.ids.slug}`,
      image: imageUrl(member.images?.headshot?.at(0), 'thumb'),
      gender: member.person.gender ?? undefined,
      // `credits_characters`: "A / B" becomes "A, B".
      role: role(member).join(', '),
      episodes: counts && member.episode_count ? countLabel(member.episode_count, 'episode') : undefined,
      episodeCount: counts && member.episode_count ? member.episode_count : undefined,
    })),
  };
}

/** The credits page's actor and crew groups. Empty groups are left out. */
export function toCredits({ actors, crew, episodeCounts }: Params): {
  actors: CreditGroup[];
  crew: CreditGroup[];
} {
  return {
    actors: actors.filter(({ members }) => members?.length)
      .map(({ label, members }) => group(label, members ?? [], ({ characters }) => characters, episodeCounts)),
    crew: crewDepartments(crew)
      .map(({ label, members }) => group(label, members, ({ jobs }) => jobs ?? [], episodeCounts)),
  };
}
