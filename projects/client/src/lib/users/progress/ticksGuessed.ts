import type { ProgressRow } from './toProgressRow.ts';

/**
 * The row's ticks are the watched share from the left, not each episode's state: its catalog isn't in, and some but
 * not all of its episodes are watched, so a gap could sit anywhere. Detailed bars read the catalog to place them.
 */
export const ticksGuessed = ({ seasons, completed, left }: Pick<ProgressRow, 'seasons' | 'completed' | 'left'>) =>
  !seasons && completed > 0 && left > 0;
