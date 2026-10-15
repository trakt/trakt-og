import type { StripStatKind } from '../components/summary/stripStats.ts';
import { countLabel } from '../utils/countLabel.ts';
import { readableStat } from '../utils/readableStat.ts';

type Stats = {
  readonly watchers: number;
  readonly plays: number;
  readonly collectors: number;
  readonly comments: number;
  readonly lists: number;
  readonly favorited?: number;
};

type Tile = {
  readonly kind: StripStatKind;
  readonly title: string;
  readonly count: number;
  /** Under the number: what it means next to the watchers, or the exact count. */
  readonly note: string;
  readonly href?: string;
};

type Params = {
  stats: Stats;
  /** The title's page, for the lists and comments links. */
  href: string;
  /** Movies and shows count favorites; seasons and episodes don't. */
  favorites: boolean;
  released: boolean;
};

/** "16%", "4.2%", "<0.1%": whole numbers from 10% up, one place under that. */
function share(part: number, whole: number) {
  const percent = (part / whole) * 100;
  if (percent > 0 && percent < 0.1) return '<0.1%';
  return percent >= 10 ? `${Math.round(percent)}%` : `${Math.round(percent * 10) / 10}%`;
}

/** Against the watchers: "0.9% of watchers", or "2.6× watchers" once it passes them. */
function ofWatchers(count: number, watchers: number) {
  return count >= watchers ? `${(count / watchers).toFixed(1)}× watchers` : `${share(count, watchers)} of watchers`;
}

const people = (count: number) => `${count.toLocaleString('en-US')} ${count === 1 ? 'person' : 'people'}`;
const libraries = (count: number) => `${count.toLocaleString('en-US')} ${count === 1 ? 'library' : 'libraries'}`;

/**
 * The stats page's Community tiles: the counts the ratings strip used to carry, favorites first, each with a line on
 * what it means next to the watchers. Before release only the list count shows, as the strip did.
 */
export function toCommunityStats({ stats, href, favorites, released }: Params) {
  const { watchers, plays, collectors, comments, lists, favorited = 0 } = stats;
  const relative = (count: number, exact: string) => (watchers > 0 ? ofWatchers(count, watchers) : exact);

  const tile = ({ count, ...rest }: Tile) => ({
    ...rest,
    value: readableStat(count),
    exact: count.toLocaleString('en-US'),
  });
  const perWatcher = watchers > 0 ? `${(plays / watchers).toFixed(2)} per watcher` : countLabel(plays, 'play');

  return [
    ...(favorites && released
      ? [{
        kind: 'favorited' as const,
        title: 'Favorites',
        count: favorited,
        note: relative(favorited, countLabel(favorited, 'favorite')),
      }]
      : []),
    ...(released
      ? [
        { kind: 'watchers' as const, title: 'Watchers', count: watchers, note: people(watchers) },
        { kind: 'plays' as const, title: 'Plays', count: plays, note: perWatcher },
        {
          kind: 'libraries' as const,
          title: 'Libraries',
          count: collectors,
          note: relative(collectors, libraries(collectors)),
        },
      ]
      : []),
    { kind: 'lists' as const, title: 'Lists', count: lists, note: countLabel(lists, 'list'), href: `${href}/lists` },
    ...(released
      ? [{
        kind: 'comments' as const,
        title: 'Comments',
        count: comments,
        note: countLabel(comments, 'comment'),
        href: `${href}/comments`,
      }]
      : []),
  ].map(tile);
}
