// What the signed-in viewer is checked in to or scrobbling, shared by the header's dot, the dashboard greeting and
// their own profile, so a check-in, a cancel or the header's poll shows everywhere at once. Browser only: this module
// is shared by every request on the server, so only effects and interactions write it.
import type { WatchingNow } from './WatchingNow.ts';

type Load = () => Promise<WatchingNow | null>;

let current = $state<WatchingNow | null>(null);
let known = $state(false);
let checkedAt = Number.NEGATIVE_INFINITY;
let seeded: WatchingNow | null | undefined;
// Bumped by every write, so a read that started before one doesn't overwrite it.
let generation = 0;

function write(value: WatchingNow | null, now: number) {
  generation++;
  current = value;
  known = true;
  checkedAt = now;
}

export const viewerWatching = {
  /** Undefined until a page or a read has said. */
  get current(): WatchingNow | null | undefined {
    return known ? current : undefined;
  },
  /** What the store knows, or `fallback` (the server-rendered page's answer) until it knows anything. */
  latest(fallback: WatchingNow | null): WatchingNow | null {
    return known ? current : fallback;
  },
  /**
   * A page's server load read it: take that answer, so the header doesn't ask again. The same answer handed over twice
   * (a profile tab switch keeps its layout's data, Back reuses a page's) is ignored, since a later read may know better.
   */
  seed(value: WatchingNow | null, now = Date.now()) {
    if (value === seeded) return;
    seeded = value;
    write(value, now);
  },
  /** Nothing is playing any more: the viewer cancelled their check-in. */
  clear(now = Date.now()) {
    write(null, now);
  },
  /**
   * Reads it with `load`, unless the store learned it in the last `maxAge` ms. A failed read keeps what was there.
   */
  async refresh({ load, maxAge = 0, now = Date.now }: { load: Load; maxAge?: number; now?: () => number }) {
    if (now() - checkedAt < maxAge) return;
    const started = generation;
    const value = await load().catch(() => undefined);
    if (value === undefined || started !== generation) return;
    write(value, now());
  },
};
