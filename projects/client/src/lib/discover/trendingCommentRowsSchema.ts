// FIXME(zod-4): og has one zod, the one @trakt/api depends on. See `src/lib/users/notes/noteRowsSchema.ts`.
import { z } from 'zod/v4';
import { commentSchema } from '../components/comments/commentSchema.ts';

const art = z.array(z.string()).nullish();
const media = {
  ids: z.object({ trakt: z.number(), slug: z.string() }),
  title: z.string(),
  year: z.number().nullish(),
  rating: z.number().nullish(),
  runtime: z.number().nullish(),
  released: z.string().nullish(),
  first_aired: z.string().nullish(),
  aired_episodes: z.number().nullish(),
  genres: z.array(z.string()).nullish(),
  images: z.object({ poster: art, fanart: art }).nullish(),
};

const row = z.object({
  type: z.string(),
  comment: commentSchema,
  movie: z.object(media).nullish(),
  show: z.object(media).nullish(),
  episode: z.object({
    season: z.number(),
    number: z.number(),
    number_abs: z.number().nullish(),
    title: z.string().nullish(),
  }).nullish(),
});

export type TrendingCommentRow = z.infer<typeof row>;

/**
 * `/comments/trending/all/all?extended=images`: each comment with its movie or show, and the episode under it.
 * `@trakt/api` 0.6.0 types the rows as bare comments, so they're parsed here. A malformed row is skipped.
 */
export const trendingCommentRowsSchema = z.array(z.unknown()).transform((rows) =>
  rows.flatMap((value): TrendingCommentRow[] => {
    const parsed = row.safeParse(value);
    return parsed.success ? [parsed.data] : [];
  })
);
