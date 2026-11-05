import type { HistoryItem } from './historyFilters.ts';
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

const charted: readonly HistorySortBy[] = [
  'added',
  'plays',
  'time',
  'title',
  'released',
  'runtime',
  'percentage',
  'votes',
];

/** All Types and Episodes are play lists the API only serves newest first. */
const historySorts: Readonly<Record<HistoryType, readonly HistorySortBy[]>> = {
  all: ['added'],
  movies: charted,
  shows: charted,
  episodes: ['added'],
};

/** One show's or season's plays chart one card an episode; a movie's or episode's plays are all the same title. */
const itemSorts: Readonly<Record<HistoryItem['type'], readonly HistorySortBy[]>> = {
  show: charted,
  season: charted,
  movie: ['added'],
  episode: ['added'],
};

export const historySortsFor = (type: HistoryType, item: HistoryItem | undefined) =>
  item ? itemSorts[item.type] : historySorts[type];

export type HistorySort = {
  readonly by: HistorySortBy;
  /** OG's `sort_how`: `asc` is each sort's own direction (newest, most, longest, A to Z), `desc` flips it. */
  readonly how: 'asc' | 'desc';
};

export const defaultHistorySort: HistorySort = { by: 'added', how: 'asc' };

export const validHistorySort = (type: HistoryType, by: string, item?: HistoryItem) =>
  historySortsFor(type, item).find((sort) => sort === by);

/** Watched Date stays newest first, as the API serves it, except for one item, whose plays are all read. */
export const flippable = ({ by }: HistorySort, item?: HistoryItem) => by !== 'added' || item !== undefined;

/** The `/:sort_by/:sort_how` segments. An unknown sort falls back to Watched Date, as OG did. */
export function historySort(type: HistoryType, segments: string | undefined, item?: HistoryItem): HistorySort {
  const [by = '', how] = (segments ?? '').split('/');
  const sort = { by: validHistorySort(type, by, item) ?? 'added', how: how === 'desc' ? 'desc' : 'asc' } as const;
  return flippable(sort, item) ? sort : defaultHistorySort;
}

/** OG's `history_user_path` after `/history`: All Types and the default sort stay out of it. */
export function historyPath(type: HistoryType, sort: HistorySort): string {
  if (sort.by !== 'added' || sort.how !== 'asc') return `/${type}/${sort.by}/${sort.how}`;
  return type === 'all' ? '' : `/${type}`;
}
