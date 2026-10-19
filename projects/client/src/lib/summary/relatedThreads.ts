import { titleize } from '../components/summary/names.ts';
import type { RelatedPerson } from './RelatedPerson.ts';
import type { RelatedPick } from './RelatedPick.ts';
import type { RelatedSource } from './RelatedSource.ts';
import type { RelatedThread } from './RelatedThread.ts';
import type { RelatedCard } from './toRelatedCard.ts';

const PEOPLE = '@people';
/** A subgenre nearly every pick shares says nothing about any one of them ("Based on Comic" under a Batman film). */
const COMMON_SHARE = 0.75;
/** Below this many picks, a shared subgenre is still worth naming. */
const COMMON_MIN_PICKS = 4;
/** Blocks in a fingerprint, so each stays wide enough to read. */
const MAX_THREADS = 10;

type RelatedThreadsParams = {
  readonly source: RelatedSource;
  /** In the API's order: its best match first. */
  readonly cards: readonly RelatedCard[];
  /** Each card's people by Trakt id, as they load. A card with none here isn't loaded yet. */
  readonly people: ReadonlyMap<number, readonly RelatedPerson[]>;
};

type RelatedThreads = { readonly threads: readonly RelatedThread[]; readonly picks: readonly RelatedPick[] };

/**
 * What each related pick shares with the summary's title. The threads are its people, then its subgenres from the most
 * shared down. The picks sort by shared subgenres, ties in the API's order. People don't move a pick: they load after
 * the band shows, and the posters shouldn't jump.
 */
export function relatedThreads({ source, cards, people }: RelatedThreadsParams): RelatedThreads {
  const known = new Set(source.people);
  const sharedPeople = (card: RelatedCard) => (people.get(card.id) ?? []).filter(({ id }) => known.has(id));
  const tooCommon = (count: number) => cards.length >= COMMON_MIN_PICKS && count > cards.length * COMMON_SHARE;

  const subgenres = source.subgenres
    .map((slug) => ({
      id: slug,
      label: titleize(slug),
      count: cards.filter((card) => card.subgenres.includes(slug)).length,
      people: false,
    }))
    .filter(({ count }) => count > 0 && !tooCommon(count))
    .toSorted((a, b) => b.count - a.count)
    // One block stays free for people, so the subgenres don't change as they load.
    .slice(0, MAX_THREADS - 1);
  const withPeople = cards.filter((card) => sharedPeople(card).length > 0).length;
  const threads = [
    ...(withPeople > 0 ? [{ id: PEOPLE, label: 'People', count: withPeople, people: true }] : []),
    ...subgenres,
  ];

  const picks = cards.map((card) => {
    const shared = sharedPeople(card);
    const has = (thread: RelatedThread) => thread.people ? shared.length > 0 : card.subgenres.includes(thread.id);
    return { card, people: shared, threads: threads.filter(has).map(({ id }) => id) };
  });
  const subgenreCount = (pick: RelatedPick) => pick.threads.filter((id) => id !== PEOPLE).length;

  return { threads, picks: picks.toSorted((a, b) => subgenreCount(b) - subgenreCount(a)) };
}
