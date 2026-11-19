import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { CastMember } from '../components/summary/CastMember.ts';
import { toCastMembers } from '../components/summary/toCastMembers.ts';
import { seasonPeopleSchema } from './seasonPeopleSchema.ts';

interface FetchGuestStarsParams {
  fetch?: typeof globalThis.fetch;
  show: number;
  actorSpoilers: boolean;
}

/** A show's guest stars, which its page leaves for the actors strip to read when picked. Public; `null` when it fails. */
export async function fetchGuestStars({
  fetch,
  show,
  actorSpoilers,
}: FetchGuestStarsParams): Promise<readonly CastMember[] | null> {
  const response = await rawApiFetch({ fetch, path: `/shows/${show}/people?extended=guest_stars` }).catch(() => null);
  if (!response?.ok) return null;
  const people = seasonPeopleSchema.safeParse(await response.json().catch(() => null));
  return people.success ? toCastMembers(people.data.guest_stars ?? [], actorSpoilers) : null;
}
