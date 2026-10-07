import { z } from 'zod/v4';

/**
 * One list with `extended=images`, as `/lists/:id`, `/lists/trending` and `/search/list` send it. `@trakt/api` 0.6.0
 * only allows `extended=full` on these, so they go through `rawApiFetch` and are parsed with this, keeping what a
 * list tile shows.
 */
export const listSchema = z.object({
  ids: z.object({ trakt: z.number() }),
  name: z.string(),
  description: z.string().nullish(),
  allow_comments: z.boolean().nullish(),
  item_count: z.number(),
  comment_count: z.number().nullish(),
  likes: z.number().nullish(),
  updated_at: z.string().nullish(),
  images: z.object({ posters: z.array(z.string()).nullish() }).nullish(),
  user: z.object({
    username: z.string(),
    name: z.string().nullish(),
    ids: z.object({ slug: z.string().nullish() }).nullish(),
    images: z.object({ avatar: z.object({ full: z.string().nullish() }).nullish() }).nullish(),
    vip: z.boolean().nullish(),
    vip_ep: z.boolean().nullish(),
    vip_og: z.boolean().nullish(),
    vip_years: z.number().nullish(),
    director: z.boolean().nullish(),
  }),
});

export type ListSource = z.infer<typeof listSchema>;
