import circlesOverlap from '../../icons/solid/circles-overlap.svg?raw';
import clapperboard from '../../icons/solid/clapperboard.svg?raw';
import codeBranch from '../../icons/solid/code-branch.svg?raw';
import heart from '../../icons/solid/heart.svg?raw';
import planetRinged from '../../icons/solid/planet-ringed.svg?raw';
import star from '../../icons/solid/star.svg?raw';
import type { MatchLevel } from './MatchLevel.ts';

/** Each match level's icon, in the pill and on the dialog. */
export const matchLevelIcon: Readonly<Record<MatchLevel['key'], string>> = {
  soulmates: heart,
  'co-stars': star,
  crossover: circlesOverlap,
  'spin-off': codeBranch,
  cameo: clapperboard,
  'different-universe': planetRinged,
};
