import { countLabel } from '../../utils/countLabel.ts';
import type { GenreBar } from './toGenreBar.ts';

/** How many genres get their own color before the rest fold into "Other". */
const SLOTS = 6;

type Piece = {
  /** Its share of the band, "8.9%". */
  readonly share: string;
  /** Its flex weight in the band. */
  readonly grow: number;
};

type GenreSlice = Piece &
  Pick<GenreBar, 'slug' | 'name' | 'counts' | 'avatar' | 'href'> & {
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
  readonly other:
    | (Piece & {
        readonly label: string;
        /** How many it folds: "23 genres", for its tooltip. */
        readonly rest: string;
        readonly tail: readonly GenreTailRow[];
      })
    | null;
};

/** "31%" from 10 up, "8.9%" and "2%" below it, "<0.1%" for the crumbs. */
function formatShare(percentage: number): string {
  if (percentage >= 10) return `${percentage.toFixed(0)}%`;
  if (percentage < 0.1) return '<0.1%';
  return `${percentage.toFixed(1).replace(/\.0$/, '')}%`;
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/** What the band's pieces are, for its labels. */
export type BandWords = {
  /** The Other piece's count: "12 genres". */
  readonly rest: (count: number) => string;
};

const GENRE_WORDS: BandWords = { rest: (count) => countLabel(count, 'genre') };

/**
 * The genres, most watched first, as one band: the top six get a color each and the rest fold into one "Other"
 * piece. Seven or fewer all get their own piece, since folding one genre into "Other" hides it for nothing.
 */
export function toGenreBand(genres: readonly GenreBar[], words: BandWords = GENRE_WORDS): GenreBand {
  const named = genres.length <= SLOTS + 1 ? genres : genres.slice(0, SLOTS);
  const tail = genres.slice(named.length);

  const slices = named.map(
    (genre, i): GenreSlice => ({
      slug: genre.slug,
      name: genre.name,
      counts: genre.counts,
      avatar: genre.avatar,
      href: genre.href,
      slot: (i % SLOTS) + 1,
      share: formatShare(genre.percentage),
      grow: genre.percentage,
    }),
  );

  if (tail.length === 0) return { slices, other: null };

  const share = sum(tail.map(({ percentage }) => percentage));
  const biggest = Math.max(...tail.map(({ percentage }) => percentage)) || 1;
  const rest = words.rest(tail.length);

  return {
    slices,
    other: {
      label: `Other · ${rest}`,
      rest,
      share: formatShare(share),
      grow: share,
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
