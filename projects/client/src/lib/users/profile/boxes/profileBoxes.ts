import { aboutMeBox } from './aboutMe/aboutMeBox.ts';
import { biggestBingeBox } from './biggestBinge/biggestBingeBox.ts';
import { featuredListBox } from './featuredList/featuredListBox.ts';
import { finishedBox } from './finished/finishedBox.ts';
import { genrePulseBox } from './genrePulse/genrePulseBox.ts';
import { lastWatchedBox } from './lastWatched/lastWatchedBox.ts';
import { onRepeatBox } from './onRepeat/onRepeatBox.ts';
import { ratingsBox } from './ratings/ratingsBox.ts';
import { topListBox } from './topList/topListBox.ts';
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
/**
 * Your own profile saves its strip between visits. Bump this when a box's view changes shape or the picker picks
 * differently, so a strip saved before isn't drawn with the new boxes.
 */
export const profileBoxesVersion = 11;

export const profileBoxes = [
  aboutMeBox,
  watchTimeBox,
  lastWatchedBox,
  onRepeatBox,
  biggestBingeBox,
  genrePulseBox,
  ratingsBox,
  finishedBox,
  topListBox,
  featuredListBox,
] as const;
