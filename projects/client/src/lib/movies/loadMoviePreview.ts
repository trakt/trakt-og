import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { previewSourceOf } from '../crawl/previewSourceOf.ts';
import { toMovieSeo } from '../seo/pages/toMovieSeo.ts';
import { readSubpageItem } from '../subpage/readSubpageItem.ts';
import { toSubpageMedia } from '../subpage/toSubpageMedia.ts';
import { toMovieSummary } from './toMovieSummary.ts';

type Params = { fetch: typeof fetch; id: string; now: Date; tagBar: boolean };

/** A movie's head for a link-preview bot, from its summary alone; a subpage's tag bar adds its collection. */
export async function loadMoviePreview({ fetch, id, now, tagBar }: Params): Promise<PreviewSource> {
  const read = await readSubpageItem({
    fetch,
    item: { type: 'movie', id },
    neighbours: false,
    collection: tagBar,
  });
  const { body } = read;
  if (body.type !== 'movie') throw new Error('A movie is read as a movie.');

  const movie = toMovieSummary({
    movie: body.movie,
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
  const media = toSubpageMedia({ body, collection: 'collection' in read ? read.collection : undefined });
  if (!media) throw new Error('A movie has subpage media.');
  return previewSourceOf({ seo: toMovieSeo(movie), media, type: 'movie', fullTitle: movie.fullTitle });
}
