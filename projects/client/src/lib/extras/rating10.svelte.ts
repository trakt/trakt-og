import { type EdgeEntrance, edgeEntrance } from './edgeEntrance.ts';

let current = $state<(EdgeEntrance & { readonly id: number }) | null>(null);
let count = 0;

/**
 * The rating-10 extra: `show()` sends it up from a random edge, and `rating-10.svelte` (in the root layout) plays it
 * and calls `done()` when it's gone. A new 10 restarts it from a new edge.
 */
export const rating10 = {
  get current() {
    return current;
  },
  show() {
    count += 1;
    current = { ...edgeEntrance(), id: count };
  },
  done(id: number) {
    if (current?.id === id) current = null;
  },
};
