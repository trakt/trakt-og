/**
 * A people page link that opens on one group: `/shows/breaking-bad/people?crew=production`. The first group is the
 * page's default, so its link stays bare.
 */
export function peopleGroupHref(
  href: string,
  { kind, id, first }: { kind: 'Actors' | 'Crew'; id: string; first: boolean },
): string {
  return first ? href : `${href}?${new URLSearchParams({ [kind.toLowerCase()]: id })}`;
}
