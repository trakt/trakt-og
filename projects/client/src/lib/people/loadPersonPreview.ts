import { api } from '../api/api.ts';
import { assertOk } from '../api/assertOk.ts';
import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { previewSourceOf } from '../crawl/previewSourceOf.ts';
import { toPersonSeo } from '../seo/pages/toPersonSeo.ts';
import { toPersonSubpageMedia } from '../subpage/toPersonSubpageMedia.ts';
import { toPersonSummary } from './toPersonSummary.ts';

type Params = { fetch: typeof fetch; id: string; now: Date };

/** A person's head for a link-preview bot, from their summary alone. */
export async function loadPersonPreview({ fetch, id, now }: Params): Promise<PreviewSource> {
  const summary = await api({ fetch }).people.summary({ params: { id }, query: { extended: 'full,markdown' } });
  assertOk(summary, 'Person');

  const person = toPersonSummary({
    person: summary.body,
    movies: null,
    shows: null,
    knownFor: [],
    listCount: 0,
    random: 0,
    now,
  });
  return previewSourceOf({ seo: toPersonSeo(person), media: toPersonSubpageMedia(summary.body), type: 'person' });
}
