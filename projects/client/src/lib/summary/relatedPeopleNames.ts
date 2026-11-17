import type { RelatedPerson } from './RelatedPerson.ts';

/** Names in a people block's tooltip before the rest are counted, so a sequel's whole cast doesn't fill the screen. */
const MAX_NAMES = 10;

/** The people a related pick shares, by name in billing order: "Bob Odenkirk, Jonathan Banks +3 more". */
export function relatedPeopleNames(people: readonly RelatedPerson[]): string {
  const names = people
    .slice(0, MAX_NAMES)
    .map(({ name }) => name)
    .join(', ');
  const rest = people.length - MAX_NAMES;
  return rest > 0 ? `${names} +${rest} more` : names;
}
