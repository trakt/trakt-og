import { aboutMeBox } from './aboutMe/aboutMeBox.ts';
import { featuredListBox } from './featuredList/featuredListBox.ts';
import { lastWatchedBox } from './lastWatched/lastWatchedBox.ts';
import { watchTimeBox } from './watchTime/watchTimeBox.ts';

/**
 * Every box the profile strip can show, in display order. The loader scores each one, `pickProfileBoxes` keeps the
 * best four, and the strip draws them in this order.
 *
 * To add a box:
 * 1. Make a folder next to this file with `<name>Box.ts`, `<Name>Box.svelte`, `<Name>View.ts` and a spec.
 * 2. In `<name>Box.ts`, export `defineProfileBox({ key, group, score, view, component })`. `score` and `view` read
 *    the `BoxInput` the profile already loads. For anything more, pass `extra: { load, when }`: `when` checks the
 *    frame's stats so the request only runs for profiles that could qualify.
 * 3. Add it to this list where it should sit in the strip.
 *
 * The picker, the loader and the strip need no changes.
 */
export const profileBoxes = [aboutMeBox, lastWatchedBox, watchTimeBox, featuredListBox] as const;
