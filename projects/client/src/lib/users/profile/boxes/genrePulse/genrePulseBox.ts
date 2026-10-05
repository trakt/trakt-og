import type { BoxInput } from '../BoxInput.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import GenrePulseBox from './GenrePulseBox.svelte';
import type { GenrePulseView } from './GenrePulseView.ts';

const MIN_PLAYS = 15;
const MIN_TITLES = 3;
/** A genre under this share of the month is too small to call a trend. */
const MIN_SHARE = 15;
const MIN_SPIKE = 1.5;

/**
 * Each genre's share of this month against its all-time share, counted the way the all-time shares are: each distinct
 * title counts once for each of its genres, and a genre's share is its count over every genre's count.
 */
function pulse({ recent, genres }: BoxInput) {
  const plays = recent.episodes.length + recent.movies.length;
  const titles = new Map([
    ...recent.episodes.map(({ show }) => [`show-${show.ids.trakt}`, show.genres ?? []] as const),
    ...recent.movies.map(({ movie }) => [`movie-${movie.ids.trakt}`, movie.genres ?? []] as const),
  ]);
  const hits = [...titles.values()].flat();
  const counts = Map.groupBy(hits, (slug) => slug);
  const usual = new Map(genres.map((row) => [row.genre.slug, row]));
  const rows = [...counts]
    .map(([slug, genreHits]) => ({
      slug,
      name: usual.get(slug)?.genre.name ?? slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
      now: (genreHits.length / hits.length) * 100,
      usual: usual.get(slug)?.percentage ?? 0,
    }))
    .toSorted((a, b) => b.now - a.now || a.slug.localeCompare(b.slug));
  const spike = rows
    .filter(({ now, usual }) => usual > 0 && now >= MIN_SHARE)
    .map((row) => ({ ...row, ratio: row.now / row.usual }))
    .toSorted((a, b) => b.ratio - a.ratio)
    .at(0);
  const eligible = plays >= MIN_PLAYS && titles.size >= MIN_TITLES && spike && spike.ratio >= MIN_SPIKE;
  return eligible ? { plays, rows, spike } : null;
}

/** Scores how far the hottest genre runs above its usual share (3.5× is a lot) and how much was watched. */
export const genrePulseBox = defineProfileBox({
  key: 'genre-pulse',
  group: 'numbers',
  component: GenrePulseBox,
  score: (input) => {
    const found = pulse(input);
    if (!found) return null;
    return 100 * (0.6 * boxMath.cap(found.spike.ratio - 1, 2.5) + 0.4 * boxMath.cap(found.plays, 60));
  },
  view: (input): GenrePulseView | null => {
    const found = pulse(input);
    if (!found) return null;
    return {
      spike: `${found.spike.ratio.toFixed(1)}×`,
      genre: found.spike.name,
      // The hot genre first, then the month's biggest others.
      rows: [found.spike, ...found.rows.filter(({ slug }) => slug !== found.spike.slug)].slice(0, 3).map((
        { name, now, usual },
      ) => ({
        name,
        now: Math.round(now),
        usual: Math.round(Math.min(usual, 100)),
      })),
    };
  },
});
