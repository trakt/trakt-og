import type { RelatedPick } from './RelatedPick.ts';
import type { RelatedThread } from './RelatedThread.ts';

type RelatedPickNoteParams = {
  readonly pick: RelatedPick;
  readonly threads: readonly RelatedThread[];
  /** The thread picked in the band's filter, if any. */
  readonly filter?: string;
};

type RelatedPickNote = { readonly shared: number; readonly total: number; readonly detail?: string };

const names = (pick: RelatedPick) => {
  const [first, ...rest] = pick.people;
  if (!first) return undefined;
  return rest.length > 0 ? `${first.name} +${rest.length}` : first.name;
};

/**
 * The line under a pick's fingerprint: "4 of 9", then one thread by name. That's the filter's thread when the pick has
 * it, else its people ("Bob Odenkirk +8"), else its most shared subgenre.
 */
export function relatedPickNote({ pick, threads, filter }: RelatedPickNoteParams): RelatedPickNote {
  const own = threads.filter(({ id }) => pick.threads.includes(id));
  const named = own.find(({ id }) => id === filter) ?? own.find(({ people }) => people) ?? own.at(0);
  const detail = named?.people ? names(pick) : named?.label;
  return { shared: own.length, total: threads.length, ...(detail ? { detail } : {}) };
}
