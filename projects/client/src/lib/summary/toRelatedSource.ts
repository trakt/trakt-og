import type { PeopleResponse } from '@trakt/api';
import type { RelatedSource } from './RelatedSource.ts';
import { toRelatedPeople } from './toRelatedPeople.ts';

type ToRelatedSourceParams = {
  readonly subgenres: readonly string[] | null | undefined;
  /** The people the summary already loaded for its cast row. */
  readonly people: PeopleResponse | null | undefined;
};

/** The summary title as the related band compares against it, from data the page already has. */
export function toRelatedSource({ subgenres, people }: ToRelatedSourceParams): RelatedSource {
  return { subgenres: subgenres ?? [], people: toRelatedPeople(people).map(({ id }) => id) };
}
