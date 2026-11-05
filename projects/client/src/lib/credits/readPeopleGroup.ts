import type { ReadonlyURLSearchParams } from '$app/state';
/** The group a people page link asks for, as the page keys it ("Crew:production"), from `?crew=` or `?actors=`. */
export function readPeopleGroup(search: ReadonlyURLSearchParams): string | undefined {
  const crew = search.get('crew');
  if (crew) return `Crew:${crew}`;
  const actors = search.get('actors');
  return actors ? `Actors:${actors}` : undefined;
}
