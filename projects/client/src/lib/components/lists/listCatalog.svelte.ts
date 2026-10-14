import { loadListCatalog } from './loadListCatalog.ts';

let counts = $state.raw<Readonly<Record<string, number>>>({});
let pending: Readonly<Record<string, Promise<void> | undefined>> = {};

/** Summary labels share the small list catalogue, without fetching membership for every poster. */
export const listCatalog = {
  count: (user: string) => counts[user],
  load: (user: string, fetch: typeof globalThis.fetch): Promise<void> => {
    if (counts[user] !== undefined) return Promise.resolve();
    const active = pending[user];
    if (active) return active;
    const before = counts[user];
    const done = loadListCatalog(fetch).then((lists) => {
      if (counts[user] === before) counts = { [user]: lists.length };
    }).finally(() => {
      pending = { ...pending, [user]: undefined };
    });
    pending = { ...pending, [user]: done };
    return done;
  },
  update: (user: string, count: number) => {
    counts = { [user]: count };
  },
};
