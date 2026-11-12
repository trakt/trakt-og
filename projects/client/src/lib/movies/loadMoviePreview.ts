import { api } from '../api/api.ts';
import { assertOk } from '../api/assertOk.ts';
import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { toMovieSeo } from '../seo/pages/toMovieSeo.ts';
import { toMovieSummary } from './toMovieSummary.ts';

type Params = { fetch: typeof fetch; id: string; now: Date };

/** A movie's head for a link-preview bot, from its summary alone. */
export async function loadMoviePreview({ fetch, id, now }: Params): Promise<PreviewSource> {
  const summary = await api({ fetch }).movies.summary({ params: { id }, query: { extended: 'full' } });
  assertOk(summary, 'Movie');

  const movie = toMovieSummary({
    movie: summary.body,
    ratings: null,
    stats: null,
    people: null,
    studios: [],
    releases: [],
    collection: null,
    rank: null,
    otherSiteRatings: false,
    now,
  });
  return { seo: toMovieSeo(movie), title: movie.fullTitle, href: movie.href, image: movie.preview };
}
