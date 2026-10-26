import { z } from 'zod/v4';

const ids = z.object({ trakt: z.number(), slug: z.string().nullish() });
const art = z.array(z.string()).nullish();
const media = z.object({
  ids,
  title: z.string(),
  year: z.number().nullish(),
  overview: z.string().nullish(),
  genres: z.array(z.string()).nullish(),
  certification: z.string().nullish(),
  network: z.string().nullish(),
  rating: z.number().nullish(),
  runtime: z.number().nullish(),
  aired_episodes: z.number().nullish(),
  first_aired: z.string().nullish(),
  released: z.string().nullish(),
  airs: z.object({ timezone: z.string().nullish() }).nullish(),
  // Every kind of art the sidebar's Artwork can pick (toSearchCard.ts).
  images: z.object({ poster: art, fanart: art, logo: art }).nullish(),
});

// Parse at the loader boundary, including API bodies, before the pure mappers see them.
// Only the fields used by the search view models are retained.
export const searchRowsSchema = z.array(
  z.object({
    type: z.enum(['movie', 'show', 'episode', 'person', 'list']),
    movie: media.nullish(),
    show: media.nullish(),
    episode: z
      .object({
        ids,
        title: z.string().nullish(),
        overview: z.string().nullish(),
        season: z.number(),
        number: z.number(),
        first_aired: z.string().nullish(),
        episode_type: z.string().nullish(),
        rating: z.number().nullish(),
        runtime: z.number().nullish(),
        images: z.object({ screenshot: art }).nullish(),
      })
      .nullish(),
    person: z
      .object({
        ids,
        name: z.string(),
        birthday: z.string().nullish(),
        death: z.string().nullish(),
        known_for_department: z.string().nullish(),
        images: z.object({ headshot: z.array(z.string()).nullish() }).nullish(),
      })
      .nullish(),
    list: z
      .object({
        ids,
        name: z.string(),
        type: z.string().nullish(),
        allow_comments: z.boolean().nullish(),
        item_count: z.number(),
        likes: z.number(),
        comment_count: z.number().nullish(),
        description: z.string().nullish(),
        images: z.object({ posters: z.array(z.string()).nullish() }).nullish(),
        user: z.object({
          username: z.string(),
          name: z.string().nullish(),
          ids: z.object({ slug: z.string().nullish() }),
          images: z.object({ avatar: z.object({ full: z.string().nullish() }).nullish() }).nullish(),
          vip: z.boolean().nullish(),
          vip_ep: z.boolean().nullish(),
          vip_og: z.boolean().nullish(),
          vip_years: z.number().nullish(),
          director: z.boolean().nullish(),
        }),
      })
      .nullish(),
  }),
);
