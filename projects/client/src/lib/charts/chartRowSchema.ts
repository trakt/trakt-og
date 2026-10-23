import { z } from 'zod/v4';

const art = z.array(z.string()).nullish();
const media = z.object({
  ids: z.object({ trakt: z.number(), slug: z.string() }),
  title: z.string(),
  year: z.number().nullish(),
  rating: z.number().nullish(),
  runtime: z.number().nullish(),
  aired_episodes: z.number().nullish(),
  first_aired: z.string().nullish(),
  airs: z.object({ timezone: z.string().nullish() }).nullish(),
  released: z.string().nullish(),
  certification: z.string().nullish(),
  network: z.string().nullish(),
  genres: z.array(z.string()).nullish(),
  overview: z.string().nullish(),
  trailer: z.string().nullish(),
  images: z.object({ fanart: art, logo: art }).nullish(),
});

/**
 * One chart row's show or movie, with only what a chart card reads. The public charts' contract rows fit it as they
 * are; recommendations, which `@trakt/api` has no contract for, are parsed with it.
 */
export const chartRowSchema = z.union([z.object({ show: media }), z.object({ movie: media })]);

export type ChartMedia = z.infer<typeof media>;
