import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { previewSourceOf } from '../crawl/previewSourceOf.ts';
import { toSeasonSeo } from '../seo/pages/toSeasonSeo.ts';
import { toDatePreferences } from '../settings/toDatePreferences.ts';
import { readSubpageItem } from '../subpage/readSubpageItem.ts';
import { toSubpageMedia } from '../subpage/toSubpageMedia.ts';
import { toSeasonSummary } from './toSeasonSummary.ts';

type Params = { fetch: typeof fetch; id: string; season: string; now: Date };

/** A season's head for a link-preview bot, from the show's summary and the season's own. */
export async function loadSeasonPreview({ fetch, id, season, now }: Params): Promise<PreviewSource> {
  const { body } = await readSubpageItem({ fetch, item: { type: 'season', id, season }, neighbours: false });
  if (body.type !== 'season') throw new Error('A season is read as a season.');

  const summary = toSeasonSummary({
    show: body.show,
    season: body.season,
    seasons: [],
    episodes: [],
    ratings: { rating: body.season.rating, votes: body.season.votes },
    stats: { watchers: 0, plays: 0, comments: 0, lists: 0, votes: 0 },
    people: { cast: [], crew: {} },
    actorSpoilers: true,
    episodeTypeTags: true,
    datePreferences: toDatePreferences(null),
    now,
  });
  const media = toSubpageMedia({ body });
  if (!media) throw new Error('A season has subpage media.');
  return previewSourceOf({ seo: toSeasonSeo(summary), media, type: 'season' });
}
