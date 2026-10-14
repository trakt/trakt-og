import type { z } from 'zod/v4';
import { personTags } from '../../people/personTags.ts';
import type { DateOrder } from '../../utils/formatDate.ts';
import { imageUrl } from '../../utils/imageUrl.ts';
import type { peopleThisMonthSchema } from './peopleThisMonthSchema.ts';
import type { SearchRow } from './toSearchRow.ts';

type Person = z.infer<typeof peopleThisMonthSchema>[number];

const SHOWN = 5;
const monthDay = (date: string) => date.slice(5, 10);
const label = (date: string) =>
  new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

// Today's birthdays, then the ones still to come this month, then the ones already past.
const rank = (birthday: string, today: string) =>
  monthDay(birthday) === monthDay(today) ? 0 : monthDay(birthday) > monthDay(today) ? 1 : 2;

/**
 * The search dropdown's People rows before anything is typed: this month's birthdays, today's first, each tagged with
 * its day ("Today" for today's), then personTags: their age (or when they died) and what they're known for. `today`
 * is the viewer's date, `YYYY-MM-DD`.
 */
export function toBirthdayRows(people: readonly Person[], today: string, order?: DateOrder): SearchRow[] {
  return people
    .flatMap((person) => (person.birthday ? [{ person, birthday: person.birthday }] : []))
    .toSorted((a, b) =>
      rank(a.birthday, today) - rank(b.birthday, today) || monthDay(a.birthday).localeCompare(monthDay(b.birthday))
    )
    .slice(0, SHOWN)
    .map(({ person, birthday }) => ({
      key: `person-${person.ids.trakt}`,
      recent: { query: person.name, type: 'people', id: person.ids.trakt },
      href: `/people/${person.ids.slug}`,
      title: person.name,
      type: 'Person',
      tag: rank(birthday, today) === 0 ? 'Today' : label(birthday),
      tags: personTags(person, { today, order }),
      poster: imageUrl(person.images?.headshot?.at(0), 'thumb'),
    }));
}
