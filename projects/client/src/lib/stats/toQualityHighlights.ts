import arrowDown from '../icons/regular/arrow-down-wide-short.svg?raw';
import anglesDown from '../icons/solid/angles-down.svg?raw';
import anglesUp from '../icons/solid/angles-up.svg?raw';
import heart from '../icons/solid/heart.svg?raw';
import type { QualityData } from './QualityData.ts';
import type { QualityPoint } from './QualityPoint.ts';

type Params = {
  data: QualityData;
  /** The viewer's own ratings as percents, a point each in order; left out for a guest or before any rating. */
  you?: readonly (number | null)[];
};

/** A count line, its bold part already split: "Season 4", or "8x04" before "The Bells". */
type Count = string | { readonly value: string; readonly text?: string };

/** One key under the chart, as the Trakt Ratings keys: "BEST SEASON", "92%", "Season 4", in its color and icon. */
type QualityKey = {
  readonly name: string;
  readonly share: string;
  readonly counts: readonly Count[];
  readonly color: string;
  readonly icon: string;
};

type Rated = QualityPoint & { readonly percent: number };

const named = ({ name, title }: QualityPoint): Count => (title ? { value: name, text: title } : { value: name });
const average = (values: readonly number[]) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

/** The steepest fall from one rated point to the next, skipping gaps; none when the line never falls. */
function biggestDrop(rated: readonly Rated[]) {
  return rated
    .flatMap((to, i) => {
      const from = rated.at(i - 1);
      return i > 0 && from ? [{ from, to, change: to.percent - from.percent }] : [];
    })
    .reduce<{ from: Rated; to: Rated; change: number } | undefined>(
      (worst, step) => (step.change < (worst?.change ?? 0) ? step : worst),
      undefined,
    );
}

function yourAverage(
  points: readonly QualityPoint[],
  you: readonly (number | null)[],
  unit: string,
): QualityKey | undefined {
  const pairs = points.flatMap((point, i) => {
    const yours = you.at(i);
    return yours == null ? [] : [{ yours, trakt: point.percent }];
  });
  if (pairs.length === 0) return undefined;
  const percent = average(pairs.map(({ yours }) => yours));
  const trakt = pairs.flatMap(({ trakt: value }) => (value === null ? [] : [value]));
  const note: Count =
    trakt.length > 0 ? { value: `Trakt ${average(trakt)}%`, text: `on the same ${unit}s` } : `${pairs.length} rated`;
  return { name: 'Your Average', share: `${percent}%`, counts: [note], color: 'var(--brand-primary)', icon: heart };
}

/**
 * The keys under the Quality Over Time chart, in the Trakt Ratings keys' style, each in its own color and icon: its best and lowest season or
 * episode, the biggest drop from one to the next and, once the viewer has rated some, their average against
 * Trakt's on the same ones. None under two rated points.
 */
export function toQualityHighlights({ data, you }: Params): QualityKey[] {
  const noun = data.unit === 'season' ? 'Season' : 'Episode';
  const rated = data.points.flatMap((point) => (point.percent === null ? [] : [{ ...point, percent: point.percent }]));
  const first = rated.at(0);
  if (!first || rated.length < 2) return [];

  const best = rated.reduce((top, point) => (point.percent > top.percent ? point : top), first);
  const lowest = rated.reduce((bottom, point) => (point.percent < bottom.percent ? point : bottom), first);
  const drop = biggestDrop(rated);
  const yours = you && yourAverage(data.points, you, data.unit);
  const pointKey = (name: string, point: Rated, look: Pick<QualityKey, 'color' | 'icon'>): QualityKey => ({
    name,
    share: `${point.percent}%`,
    counts: [named(point)],
    ...look,
  });

  return [
    pointKey(`Best ${noun}`, best, { color: 'var(--color-stats-diff-up)', icon: anglesUp }),
    pointKey(`Lowest ${noun}`, lowest, { color: 'var(--color-stats-diff-down)', icon: anglesDown }),
    ...(drop
      ? [
          {
            name: 'Biggest Drop',
            share: `−${Math.abs(drop.change)}`,
            counts: [{ value: `${drop.from.name} to ${drop.to.name}` }],
            color: 'var(--color-stats-diff-flat)',
            icon: arrowDown,
          },
        ]
      : []),
    ...(yours ? [yours] : []),
  ];
}
