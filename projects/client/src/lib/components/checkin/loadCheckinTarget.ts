import { z } from 'zod/v4';
import { episodeNumber } from '../media/episodeTags.ts';
import { mediaImage } from '../../images/mediaImage.ts';
import type { CheckinTarget } from './CheckinTarget.ts';

const media = z.object({
  ids: z.object({ trakt: z.number() }),
  title: z.string().nullish(),
  year: z.number().nullish(),
});
const rowsSchema = z.array(
  z.object({
    movie: media.nullish(),
    show: media.nullish(),
    episode: z
      .object({
        season: z.number(),
        number: z.number(),
        title: z.string().nullish(),
        first_aired: z.string().nullish(),
      })
      .nullish(),
  }),
);

type Row = z.infer<typeof rowsSchema>[number];

function toCheckinTarget(type: CheckinTarget['type'], id: number, row: Row): CheckinTarget | null {
  const item = type === 'movie' ? row.movie : row.show;
  if (!item?.title) return null;
  const base = {
    type,
    id,
    topTitle: item.title,
    fanart: mediaImage({ type: type === 'movie' ? 'movie' : 'show', id: item.ids.trakt, slot: 'fanart', size: 'full' }),
  };
  if (type === 'movie') return { ...base, fullTitle: item.year ? `${item.title} (${item.year})` : item.title };

  const { episode } = row;
  if (!episode) return null;
  const number = episodeNumber(episode, null);
  return {
    ...base,
    fullTitle: `${item.title} ${number}${episode.title ? ` "${episode.title}"` : ''}`,
    episode: {
      number,
      title: episode.title ?? '',
      firstAired: episode.first_aired ?? undefined,
      screenshot: mediaImage({ type: 'episode', id, slot: 'screenshot', size: 'full' }),
    },
  };
}

/** One public lookup gives every modal field for a movie or episode, from a summary button or any card. */
export async function loadCheckinTarget({
  type,
  id,
  fetch,
}: {
  type: CheckinTarget['type'];
  id: number;
  fetch: (path: string) => Promise<Response>;
}): Promise<CheckinTarget | null> {
  const response = await fetch(`/search/trakt/${id}?type=${type}&extended=full`);
  if (!response.ok) return null;
  const row = rowsSchema.parse(await response.json()).at(0);
  return row ? toCheckinTarget(type, id, row) : null;
}
