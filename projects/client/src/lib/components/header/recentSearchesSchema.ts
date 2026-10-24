import { z } from 'zod/v4';

const term = z.object({
  query: z.string().trim().min(1),
  type: z
    .string()
    .nullish()
    .transform((type) => type ?? ''),
});

/** The saved history in this browser. An entry that doesn't parse is dropped, not the whole history. */
export const recentSearchesSchema = z.array(z.unknown()).transform((items) =>
  items.flatMap((item) => {
    const parsed = term.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  }),
);
