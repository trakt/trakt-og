import type { z } from 'zod/v4';
import { recentSearchesSchema } from './recentSearchesSchema.ts';

export type RecentSearch = Readonly<z.infer<typeof recentSearchesSchema>[number]>;
type Params = {
  key: string;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
};

const LIMIT = 5;
const sameTerm = (a: RecentSearch) => (b: RecentSearch) =>
  a.query.toLowerCase() === b.query.toLowerCase() && a.type === b.type;
const unique = (terms: ReadonlyArray<RecentSearch>) =>
  terms.filter((term, index) => terms.findIndex(sameTerm(term)) === index).slice(0, LIMIT);

/** The last five searches, newest first, kept in `storage` under `key`. Without storage they last as long as the page. */
export function createRecentSearches({ key, storage }: Params) {
  const load = () => {
    try {
      return storage?.getItem(key);
    } catch {
      return undefined;
    }
  };
  const parse = (saved: string | null) => {
    try {
      return unique(recentSearchesSchema.parse(JSON.parse(saved ?? '[]')));
    } catch {
      return [];
    }
  };
  const read = () => {
    const saved = load();
    return saved === undefined ? undefined : parse(saved);
  };
  let terms = $state.raw<ReadonlyArray<RecentSearch>>(read() ?? []);

  const write = (next: ReadonlyArray<RecentSearch>) => {
    terms = next;
    try {
      if (next.length) storage?.setItem(key, JSON.stringify(next));
      else storage?.removeItem(key);
    } catch {
      /* Private mode or a full quota: the history lasts as long as the page. */
    }
  };
  const latest = () => read() ?? terms;

  return {
    get terms() {
      return terms;
    },
    record({ query, type }: { query: string; type: string }) {
      const term = { query: query.trim(), type };
      if (!term.query) return;
      write(unique([term, ...latest()]));
    },
    remove(term: RecentSearch) {
      write(latest().filter((other) => !sameTerm(term)(other)));
    },
    clear() {
      write([]);
    },
    reload() {
      terms = latest();
    },
  };
}
