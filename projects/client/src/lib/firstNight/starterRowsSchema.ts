// FIXME(zod-4): see noteRowsSchema.ts. og has one zod, the one @trakt/api depends on.
import { z } from 'zod/v4';

const mediaSchema = z.object({
  title: z.string(),
  year: z.number().nullish(),
  ids: z.object({ trakt: z.number(), slug: z.string() }),
  images: z.object({ poster: z.array(z.string()).nullish(), fanart: z.array(z.string()).nullish() }).nullish(),
  rating: z.number().nullish(),
  runtime: z.number().nullish(),
  aired_episodes: z.number().nullish(),
  first_aired: z.string().nullish(),
  released: z.string().nullish(),
});

/** A public chart's rows: popular rows are the bare title, the other charts wrap it with their counts. */
export const starterRowsSchema = z.array(
  z.union([z.object({ show: mediaSchema }), z.object({ movie: mediaSchema }), mediaSchema]),
);

export type StarterMedia = z.output<typeof mediaSchema>;
export type StarterRow = z.output<typeof starterRowsSchema>[number];
