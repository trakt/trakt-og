import { RATING_LABELS } from '../../components/rating/ratingPrompt.ts';
import { countLabel } from '../../utils/countLabel.ts';

/** One bar of the profile's ratings chart. */
export type ProfileRatingBar = {
  readonly rating: number;
  readonly count: number;
  /** "Totally Ninja!", under the rating on the axis. */
  readonly name: string;
  /** Height as a share of the plot, 0 to 100. */
  readonly height: number;
  /** "16%" of all ratings, for the tooltip. */
  readonly share: string;
  /** The most given rating, picked out on the axis. */
  readonly top: boolean;
};

/** A dashed count line across the plot, "100", at a height from 0 to 100. */
type RatingsLevel = { readonly label: string; readonly height: number };

/** One genre-style key under the chart: "MOST GIVEN", "10", "Totally Ninja! · 405 ratings". */
type RatingsKey = {
  readonly name: string;
  readonly share: string;
  readonly counts: readonly string[];
  /** Colors its rule like that rating's bar; neutral without one. */
  readonly rating?: number;
};

export type ProfileRatings = {
  /** "937", bold in OG's help line, which stays for a profile with no ratings. */
  readonly count: string;
  /** "8.50", or "0" with no ratings. */
  readonly average: string;
  /** Null with no ratings: OG kept the heading and help line and hid the chart. */
  readonly chart: {
    /** Ratings 1 to 10. */
    readonly bars: readonly ProfileRatingBar[];
    readonly levels: readonly RatingsLevel[];
    /** The dashed average line: "8.50 average", `at` 0 to 100 along the ratings. */
    readonly average: { readonly label: string; readonly at: number; readonly labelBefore: boolean };
  } | null;
  /** Ratings, average, most given and loved under the chart; empty with no ratings. */
  readonly keys: readonly RatingsKey[];
};

/** How many movies, shows, seasons and episodes were rated: `/users/:id/stats`'s per-type `ratings`. */
type RatedTypes = {
  readonly movies: number;
  readonly shows: number;
  readonly seasons: number;
  readonly episodes: number;
};

type ToProfileRatingsParams = {
  readonly distribution: Readonly<Record<string, number>> | undefined;
  /** Left out, the Ratings key has no per-type line. */
  readonly types?: RatedTypes;
};

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const LOVED = [9, 10] as const;
/** Room over the tallest bar for its count. */
const HEADROOM = 1.15;
const MAX_LEVELS = 5;
const STEPS = [1, 2, 2.5, 5] as const;
/** Past this average, the line's label sits before it so it doesn't run off the chart. */
const LABEL_BEFORE_FROM = 9;

/** "16%", "4.2%", "<0.1%": whole numbers from 10% up, one place under that. */
function ratingShare(part: number, whole: number) {
  if (part === 0 || whole === 0) return '0%';
  const share = (part / whole) * 100;
  if (share < 0.1) return '<0.1%';
  const tenths = Math.round(share * 10) / 10;
  return tenths >= 10 ? `${Math.round(share)}%` : `${tenths}%`;
}

/**
 * Count lines in whole steps of 1, 2, 2.5 or 5 times a power of ten: the finest that draws no more than five lines
 * up to the tallest bar plus its headroom.
 */
function ratingsScale(tallest: number) {
  const want = Math.max(tallest, 1) * HEADROOM;
  const exponent = Math.floor(Math.log10(want / MAX_LEVELS));
  const step = [exponent, exponent + 1]
    .flatMap((e) => STEPS.map((m) => m * 10 ** e))
    .find((s) => Number.isInteger(s) && Math.ceil(want / s) <= MAX_LEVELS) ?? 10 ** (exponent + 1);
  const lines = Math.ceil(want / step);
  const top = lines * step;
  return {
    top,
    levels: Array.from({ length: lines }, (_, i) => {
      const value = (i + 1) * step;
      return { label: value.toLocaleString('en-US'), height: (value / top) * 100 };
    }),
  };
}

function typesLine(types: RatedTypes) {
  return [
    countLabel(types.movies, 'movie'),
    countLabel(types.shows, 'show'),
    ...(types.seasons > 0 ? [countLabel(types.seasons, 'season')] : []),
    countLabel(types.episodes, 'episode'),
  ];
}

/**
 * The profile's Ratings chart and its keys from `/users/:id/stats`: `ratings.distribution` as ten bars in their
 * rating colors on a scale of count lines, the average along the ratings, and the total, average, most given rating
 * (the highest on a tie) and the share of 9s and 10s under it.
 */
export function toProfileRatings({ distribution, types }: ToProfileRatingsParams): ProfileRatings {
  const counts = RATINGS.map((rating) => distribution?.[rating] ?? 0);
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (total === 0) return { count: '0', average: '0', chart: null, keys: [] };

  const countOf = (rating: number) => counts.at(rating - 1) ?? 0;
  const average = counts.reduce((sum, n, i) => sum + n * (i + 1), 0) / total;
  const most = Math.max(...counts);
  const top = RATINGS.findLast((rating) => countOf(rating) === most) ?? 10;
  const loved = LOVED.reduce((sum, rating) => sum + countOf(rating), 0);
  const scale = ratingsScale(most);

  return {
    count: total.toLocaleString('en-US'),
    average: average.toFixed(2),
    chart: {
      bars: RATINGS.map((rating) => ({
        rating,
        count: countOf(rating),
        name: RATING_LABELS[rating] ?? '',
        height: (countOf(rating) / scale.top) * 100,
        share: ratingShare(countOf(rating), total),
        top: rating === top,
      })),
      levels: scale.levels,
      // Bar n's middle sits at (n - 0.5) tenths of the way along.
      average: {
        label: `${average.toFixed(2)} average`,
        at: (average - 0.5) * 10,
        labelBefore: average > LABEL_BEFORE_FROM,
      },
    },
    keys: [
      { name: 'Ratings', share: total.toLocaleString('en-US'), counts: types ? typesLine(types) : [] },
      { name: 'Average', share: average.toFixed(2), counts: ['hearts out of 10'] },
      {
        name: 'Most given',
        rating: top,
        share: String(top),
        counts: [RATING_LABELS[top] ?? '', countLabel(most, 'rating')],
      },
      { name: 'Loved · 9 and 10', rating: 10, share: ratingShare(loved, total), counts: [countLabel(loved, 'rating')] },
    ],
  };
}
