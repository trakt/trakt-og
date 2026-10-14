import { z } from 'zod/v4';
/** Native reads and API CRUD responses share these editable fields. */
export const editableListSchema = z.object({
  ids: z.object({ trakt: z.number(), slug: z.string().nullish() }),
  name: z.string(),
  description: z.string().nullish(),
  privacy: z.string(),
  /** The private URL a Link list is shared by. */
  share_link: z.string().nullish(),
  allow_comments: z.boolean(),
  display_numbers: z.boolean(),
  sort_by: z.string().nullish(),
  sort_how: z.string().nullish(),
  item_count: z.number(),
});
