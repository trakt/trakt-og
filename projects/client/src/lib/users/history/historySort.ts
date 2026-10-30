import type { HistoryType } from './historyTypes.ts';

/** OG's history sort labels, less Popularity, which the API has no rank for. */
export const historySortLabels = {
  added: 'Watched Date',
  plays: 'Plays',
  time: 'Time Spent',
  title: 'Title',
  released: 'Release Date',
  runtime: 'Runtime',
  percentage: 'Percentage',
  votes: 'Votes',
} as const;

export type HistorySortBy = keyof typeof historySortLabels;

const charted = Object.keys(historySortLabels) as HistorySortBy[];

/** All Types and Episodes are play lists the API only serves newest first. */
export const historySorts: Readonly<Record<HistoryType, readonly HistorySortBy[]>> = {
  all: ['added'],
  movies: charted,
  shows: charted,
  episodes: ['added'],
};

export type HistorySort = {
  readonly by: HistorySortBy;
  /** OG's `sort_how`: `asc` is each sort's own direction (newest, most, longest, A to Z), `desc` flips it. */
  readonly how: 'asc' | 'desc';
};

export const defaultHistorySort: HistorySort = { by: 'added', how: 'asc' };

export const validHistorySort = (type: HistoryType, by: string) => historySorts[type].find((sort) => sort === by);

/** Watched Date stays newest first: the play lists can't run the other way. */
export const flippable = ({ by }: HistorySort) => by !== 'added';

/** The `/:sort_by/:sort_how` segments. An unknown sort falls back to Watched Date, as OG did. */
export function historySort(type: HistoryType, segments: string | undefined): HistorySort {
  const [by = '', how] = (segments ?? '').split('/');
  const sort = { by: validHistorySort(type, by) ?? 'added', how: how === 'desc' ? 'desc' : 'asc' } as const;
  return flippable(sort) ? sort : defaultHistorySort;
}

/** OG's `history_user_path` after `/history`: All Types and the default sort stay out of it. */
export function historyPath(type: HistoryType, sort: HistorySort): string {
  if (sort.by !== 'added' || sort.how !== 'asc') return `/${type}/${sort.by}/${sort.how}`;
  return type === 'all' ? '' : `/${type}`;
}
