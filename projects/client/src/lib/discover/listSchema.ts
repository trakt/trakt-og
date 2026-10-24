import { z } from 'zod/v4';

/**
 * One list with `extended=images`, as `/lists/:id`, `/lists/trending` and `/search/list` send it, parsed to what a list
 * tile shows. `@trakt/api` doesn't allow `extended=images` on `/search/list`, so that one goes through `rawApiFetch`.
 */
export const listSchema = z.object({
  type: z.string().nullish(),
  ids: z.object({ trakt: z.number(), slug: z.string().nullish() }),
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
