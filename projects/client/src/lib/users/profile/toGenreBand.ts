import { countLabel } from '../../utils/countLabel.ts';
import type { GenreBar } from './toGenreBar.ts';

/** How many genres get their own color before the rest fold into "Other". */
const SLOTS = 6;

/** The hover card over a piece: "#2 Comedy", "18%", the show and movie counts, and a footer line. */
type GenreTip = {
  readonly title: string;
  readonly share: string;
  readonly lines: readonly { readonly type: 'shows' | 'movies'; readonly text: string }[];
  readonly footer: string;
};

type Piece = {
  /** Its share of the band, "8.9%". */
  readonly share: string;
  /** Its flex weight in the band. */
  readonly grow: number;
  /** Where its middle sits along the band, 0 to 100: the tooltip's anchor. */
  readonly center: number;
  readonly tip: GenreTip;
};

type GenreSlice = Piece & Pick<GenreBar, 'slug' | 'name' | 'counts'> & {
  /** Its color, 1 to 6. */
  readonly slot: number;
};

type GenreTailRow = Pick<GenreBar, 'slug' | 'name' | 'counts'> & {
  readonly share: string;
  /** Its mini bar's width, as a percentage of the biggest genre in the tail. */
  readonly mini: number;
};

export type GenreBand = {
  readonly slices: readonly GenreSlice[];
  /** The striped piece the long tail folds into, null when every genre fits. */
  readonly other: (Piece & { readonly label: string; readonly tail: readonly GenreTailRow[] }) | null;
};

/** "31%" from 10 up, "8.9%" and "2%" below it, "<0.1%" for the crumbs. */
function formatShare(percentage: number): string {
  if (percentage >= 10) return `${percentage.toFixed(0)}%`;
  if (percentage < 0.1) return '<0.1%';
  return `${percentage.toFixed(1).replace(/\.0$/, '')}%`;
}

const tipLines = ({ shows, movies }: { shows: number; movies: number }) => [
  ...(shows > 0 ? [{ type: 'shows' as const, text: countLabel(shows, 'show') }] : []),
  ...(movies > 0 ? [{ type: 'movies' as const, text: countLabel(movies, 'movie') }] : []),
];

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/**
 * The genres, most watched first, as one band: the top six get a color each and the rest fold into one "Other"
 * piece. Seven or fewer all get their own piece, since folding one genre into "Other" hides it for nothing.
 */
export function toGenreBand(genres: readonly GenreBar[]): GenreBand {
  const named = genres.length <= SLOTS + 1 ? genres : genres.slice(0, SLOTS);
  const tail = genres.slice(named.length);
  const total = sum(genres.map(({ percentage }) => percentage)) || 1;
  const before = (i: number) => sum(genres.slice(0, i).map(({ percentage }) => percentage));
  const center = (start: number, width: number) => ((start + width / 2) / total) * 100;

  const slices = named.map((genre, i): GenreSlice => {
    const titles = countLabel(genre.shows + genre.movies, 'title');
    return {
      slug: genre.slug,
      name: genre.name,
      counts: genre.counts,
      slot: (i % SLOTS) + 1,
      share: formatShare(genre.percentage),
      grow: genre.percentage,
      center: center(before(i), genre.percentage),
      tip: {
        title: `#${i + 1} ${genre.name}`,
        share: formatShare(genre.percentage),
        lines: tipLines(genre),
        footer: i === 0
          ? `${titles} · your top genre`
          : `${titles} · ${formatShare(genre.percentageRow)} of your top genre`,
      },
    };
  });

  if (tail.length === 0) return { slices, other: null };

  const share = sum(tail.map(({ percentage }) => percentage));
  const biggest = Math.max(...tail.map(({ percentage }) => percentage)) || 1;
  const label = `Other · ${tail.length} genres`;
  const names = tail.slice(0, 3).map(({ name }) => name).join(', ');

  return {
    slices,
    other: {
      label,
      share: formatShare(share),
      grow: share,
      center: center(before(named.length), share),
      tip: {
        title: label,
        share: formatShare(share),
        lines: tipLines({ shows: sum(tail.map(({ shows }) => shows)), movies: sum(tail.map(({ movies }) => movies)) }),
        footer: tail.length > 3 ? `${names}, …` : names,
      },
      tail: tail.map((genre) => ({
        slug: genre.slug,
        name: genre.name,
        counts: genre.counts,
        share: formatShare(genre.percentage),
        mini: (genre.percentage / biggest) * 100,
      })),
    },
  };
}
