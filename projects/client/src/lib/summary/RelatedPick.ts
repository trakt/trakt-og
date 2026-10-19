import type { RelatedCard } from './toRelatedCard.ts';
import type { RelatedPerson } from './RelatedPerson.ts';

/** A related card with what it shares with the summary's title. */
export type RelatedPick = {
  readonly card: RelatedCard;
  /** The ids of the band's threads this pick shares, in the band's order. */
  readonly threads: readonly string[];
  /** The people it shares, in billing order. Empty until its people load. */
  readonly people: readonly RelatedPerson[];
};
