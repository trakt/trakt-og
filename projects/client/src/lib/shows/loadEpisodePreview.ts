import type { PreviewSource } from '../crawl/PreviewSource.ts';
import { previewSourceOf } from '../crawl/previewSourceOf.ts';
import { toEpisodeSeo } from '../seo/pages/toEpisodeSeo.ts';
import { mediaSpoilers } from '../settings/mediaSpoilers.ts';
import { toDatePreferences } from '../settings/toDatePreferences.ts';
import { readSubpageItem } from '../subpage/readSubpageItem.ts';
import { toSubpageMedia } from '../subpage/toSubpageMedia.ts';
import { toEpisodeSummary } from './toEpisodeSummary.ts';

type Params = { fetch: typeof fetch; id: string; season: string; episode: string; now: Date };

/** An episode's head for a link-preview bot, from the show's, the episode's and its season's summaries. */
export async function loadEpisodePreview({ fetch, id, season, episode, now }: Params): Promise<PreviewSource> {
  const { body } = await readSubpageItem({ fetch, item: { type: 'episode', id, season, episode }, neighbours: false });
  if (body.type !== 'episode') throw new Error('An episode is read as an episode.');

  const summary = toEpisodeSummary({
    show: body.show,
    season: body.season ?? { number: body.episode.season, ids: { trakt: 0 } },
    episode: body.episode,
    seasons: [],
    people: { cast: [], crew: {} },
    ratings: { rating: body.episode.rating, votes: body.episode.votes },
    stats: { watchers: 0, plays: 0, comments: 0, lists: 0, votes: 0 },
    datePreferences: toDatePreferences(null),
    now,
    episodeTypeTags: true,
    otherSiteRatings: false,
  });
  const media = toSubpageMedia({ body });
  if (!media) throw new Error('An episode has subpage media.');
  const spoilers = mediaSpoilers({ spoilers: null, type: 'episode' });
  return previewSourceOf({ seo: toEpisodeSeo({ episode: summary, spoilers }), media, type: 'episode' });
}
