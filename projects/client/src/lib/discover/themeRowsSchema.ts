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
  released: z.string().nullish(),
  certification: z.string().nullish(),
  network: z.string().nullish(),
  genres: z.array(z.string()).nullish(),
  overview: z.string().nullish(),
  trailer: z.string().nullish(),
  images: z.object({ poster: art, fanart: art, logo: art }).nullish(),
});

/**
 * Rows from `/:type/trending` and `/:type/favorited/all` with a theme's filters. `@trakt/api` 0.6.0's favorited
 * contract has no filter params, so both go through `rawApiFetch` and are parsed here. Only what a showcase slide uses
 * is kept.
 */
export const themeRowsSchema = z.array(z.object({ movie: media.nullish(), show: media.nullish() }));

export type ThemeRow = z.infer<typeof themeRowsSchema>[number];
export type ThemeMedia = NonNullable<ThemeRow['movie']>;
