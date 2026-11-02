import { fromSavedFilter } from './fromSavedFilter.ts';
import type { SmartList, SmartListWrite } from './SmartList.ts';

type Params = {
  saved: readonly { readonly name: string; readonly path: string; readonly query: string }[];
  /** The viewer's smart lists, so a filter already brought over (by name) isn't offered twice. */
  existing: readonly Pick<SmartList, 'name'>[];
  now: Date;
};

const key = (name: string) => name.trim().toLowerCase();

/**
 * What bringing back classic saved filters would do: the smart lists to make, and how many filters can't come back.
 * Null when there's nothing left to offer.
 */
export function savedFilterImport({ saved, existing, now }: Params) {
  const taken = new Set(existing.map(({ name }) => key(name)));
  const fresh = saved.filter(({ name }) => !taken.has(key(name)));
  const lists = fresh.flatMap((filter): SmartListWrite[] => {
    const list = fromSavedFilter(filter, now);
    return list ? [list] : [];
  });
  return lists.length > 0 ? { lists, skipped: fresh.length - lists.length } : null;
}
