import type { PersonCredit } from './PersonCredit.ts';

/**
 * The credits sort menu, each with its natural direction. OG's Popularity sorted by the same vote count as Votes, so
 * it's left out and an old link reads as Votes (`toCreditsQuery`).
 */
export const creditSorts = [
  { id: 'released', label: 'Released', key: 'released', descending: true },
  { id: 'title', label: 'Title', key: 'title', descending: false },
  { id: 'percentage', label: 'Percentage', key: 'percentage', descending: true },
  { id: 'votes', label: 'Votes', key: 'votes', descending: true },
  { id: 'runtime', label: 'Runtime', key: 'runtime', descending: true },
  { id: 'episodes', label: 'Episode Count', key: 'episodes', descending: true },
] as const satisfies readonly {
  id: string;
  label: string;
  key: keyof PersonCredit['sortBy'];
  descending: boolean;
}[];

export type CreditSortId = (typeof creditSorts)[number]['id'];
