import { type NinjaEntrance, ninjaEntrance } from './ninjaEntrance.ts';

let current = $state<(NinjaEntrance & { readonly id: number }) | null>(null);
let count = 0;

/**
 * The rating-10 easter egg: `show()` sends the Totally Ninja guy up from a random edge, and `TotallyNinja` (in the
 * root layout) plays it and calls `done()` when he's gone. A new 10 restarts him from a new edge.
 */
export const ninja = {
  get current() {
    return current;
  },
  show() {
    count += 1;
    current = { ...ninjaEntrance(), id: count };
  },
  done(id: number) {
    if (current?.id === id) current = null;
  },
};
