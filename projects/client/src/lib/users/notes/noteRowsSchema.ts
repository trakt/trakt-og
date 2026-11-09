// FIXME(zod-4): og pins zod 3.25.76, the version @trakt/api 0.6.0 already depends on, so the project has one zod.
// That release ships the v4 API under `zod/v4`, which is what this code uses. When @trakt/api moves to zod 4, bump og's
// zod to the same major and import from `zod` instead. Don't add a second zod install before then. A weekly bump that
// moves zod to 4 needs human review: decline it until @trakt/api has moved.
import { z } from 'zod/v4';

const media = z.object({
  ids: z.object({ trakt: z.number(), slug: z.string().nullish() }),
  title: z.string().nullish(),
  name: z.string().nullish(),
  year: z.number().nullish(),
  number: z.number().nullish(),
  season: z.number().nullish(),
  rating: z.number().nullish(),
  aired_episodes: z.number().nullish(),
  runtime: z.number().nullish(),
  episode_type: z.string().nullish(),
});
const user = z.object({
  username: z.string(),
  name: z.string().nullish(),
  ids: z.object({ slug: z.string().nullish(), trakt: z.number().nullish() }),
  vip: z.boolean().nullish(),
  vip_ep: z.boolean().nullish(),
  vip_og: z.boolean().nullish(),
  vip_years: z.number().nullish(),
  director: z.boolean().nullish(),
  deleted: z.boolean().nullish(),
});

/** API's listing wraps each note; @trakt/api 0.6.0 types this endpoint as a bare NoteResponse[]. */
export const noteRowsSchema = z.array(
  z.object({
    attached_to: z.object({
      type: z.string(),
      watched_at: z.iso.datetime({ offset: true }).nullish(),
      collected_at: z.iso.datetime({ offset: true }).nullish(),
      rated_at: z.iso.datetime({ offset: true }).nullish(),
      rating: z.number().nullish(),
    }),
    type: z.enum(['movie', 'show', 'season', 'episode', 'person']),
    movie: media.nullish(),
    show: media.nullish(),
    season: media.nullish(),
    episode: media.nullish(),
    person: media.nullish(),
    note: z.object({
      id: z.number(),
      notes: z.string().nullish(),
      privacy: z.enum(['public', 'friends', 'private']),
      spoiler: z.boolean().nullish(),
      created_at: z.iso.datetime({ offset: true }).nullish(),
      updated_at: z.iso.datetime({ offset: true }),
      user: user.nullish(),
    }),
  }),
);
