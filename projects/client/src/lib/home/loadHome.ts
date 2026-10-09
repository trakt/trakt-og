import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { createTtlCache } from '../utils/createTtlCache.ts';
import { fetchHomeFanarts } from './fetchHomeFanarts.ts';
import { pickHomeFanarts } from './pickHomeFanarts.ts';
import type { HomeFanart } from './toHomeFanarts.ts';

const HOUR_MS = 60 * 60 * 1000;

// The titles are fixed and their art changes rarely, so it's read at most every six hours per worker. Each visit
// still gets its own shuffle.
const fanartPool = createTtlCache<HomeFanart[]>({ ttlMs: 6 * HOUR_MS, retryMs: 5 * 60 * 1000 });

interface LoadHomeParams {
  fetch: typeof globalThis.fetch;
  now: number;
  random: () => number;
  parent: () => Promise<{ user: HeaderUser | null }>;
  /** Tests pass a fresh cache; the page shares one per worker. */
  pool?: typeof fanartPool;
}

/** `/home`: the hero's fanart from the cache, shuffled, and whether the viewer is signed in. No art is no error. */
export async function loadHome({ fetch, now, random, parent, pool = fanartPool }: LoadHomeParams) {
  const [fanarts, { user }] = await Promise.all([
    pool({ now, load: () => fetchHomeFanarts(fetch) }).catch((): HomeFanart[] => []),
    parent(),
  ]);
  return { fanarts: pickHomeFanarts({ pool: fanarts, count: fanarts.length, random }), signedIn: user !== null };
}
