import type { ComponentProps } from 'svelte';
import type FanartCard from '../../../components/media/FanartCard.svelte';
import { quickIconFill } from '../../../components/media/quickIconFill.ts';
import type { OverlayState } from '../../../overlay/createOverlay.svelte.ts';
import type { DatePreferences } from '../../../settings/DatePreferences.ts';
import type { FranchiseRow } from './FranchiseRow.ts';

type FranchiseMovieIconsParams = {
  movie: FranchiseRow['movies'][number];
  state: OverlayState;
  datePreferences: DatePreferences;
};

/** A franchise movie's quick icons, as a list's movie poster has them. Not out yet, its watch icon is locked. */
export const franchiseMovieIcons = ({
  movie,
  state,
  datePreferences,
}: FranchiseMovieIconsParams): NonNullable<ComponentProps<typeof FanartCard>['icons']> => ({
  fill: quickIconFill({ state, runtime: movie.runtime, datePreferences }),
  rating: movie.rating,
  released: movie.released,
  ratingTarget: { type: 'movie', id: movie.id, title: movie.title },
  watchTarget: { type: 'movie', id: movie.id, title: movie.title, runtime: movie.runtime },
  listLabel: 'Add to watchlist',
});
