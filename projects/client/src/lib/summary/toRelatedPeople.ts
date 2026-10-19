import type { PeopleResponse } from '@trakt/api';
import type { RelatedPerson } from './RelatedPerson.ts';

/** The billed cast that counts as shared. Past it, a day player in both titles would read as a real link. */
const CAST_LIMIT = 25;
/** The crew jobs that shape a title. A shared caterer or accountant doesn't. */
const KEY_JOBS: ReadonlySet<string> = new Set([
  'Creator',
  'Director',
  'Director of Photography',
  'Novel',
  'Original Music Composer',
  'Screenplay',
  'Story',
  'Writer',
]);

/** A title's billed cast, then its key crew, once each. */
export function toRelatedPeople(people: PeopleResponse | null | undefined): readonly RelatedPerson[] {
  const cast = (people?.cast ?? []).slice(0, CAST_LIMIT).map(({ person }) => person);
  const crew = Object.values(people?.crew ?? {})
    .flat()
    .filter((member) => member.jobs.some((job) => KEY_JOBS.has(job)))
    .map(({ person }) => person);

  const firsts = [...cast, ...crew].filter((person, i, all) =>
    all.findIndex((other) => other.ids.trakt === person.ids.trakt) === i
  );
  return firsts.map((person) => ({ id: person.ids.trakt, name: person.name }));
}
