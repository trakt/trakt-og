import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { previewSourceOf } from '../crawl/previewSourceOf.ts';
import { toShowSeo } from '../seo/pages/toShowSeo.ts';
import { toDatePreferences } from '../settings/toDatePreferences.ts';
import { readSubpageItem } from '../subpage/readSubpageItem.ts';
import { toSubpageMedia } from '../subpage/toSubpageMedia.ts';
import { toShowSummary } from './toShowSummary.ts';

type Params = { fetch: typeof fetch; id: string; now: Date };

/** A show's head for a link-preview bot, from its summary alone. */
export async function loadShowPreview({ fetch, id, now }: Params): Promise<PreviewSource> {
  const { body } = await readSubpageItem({ fetch, item: { type: 'show', id }, neighbours: false });
  if (body.type !== 'show') throw new Error('A show is read as a show.');

  const show = toShowSummary({
    show: body.show,
    ratings: null,
    stats: null,
    people: null,
    studios: [],
    seasons: [],
    progress: null,
    signedIn: false,
    rank: null,
    otherSiteRatings: false,
    actorSpoilers: true,
    episodeTypeTags: true,
    datePreferences: toDatePreferences(null),
    now,
  });
  const media = toSubpageMedia({ body });
  if (!media) throw new Error('A show has subpage media.');
  return previewSourceOf({ seo: toShowSeo(show), media, type: 'show', fullTitle: show.fullTitle });
}
