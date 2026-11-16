import { z } from 'zod/v4';

/**
 * An array body, each row parsed with `row`. A row that doesn't match is skipped instead of failing the whole read,
 * so one bad item (one the API hides but still returns, say) doesn't cost the rest.
 */
export const readableRows = <T>(row: z.ZodType<T>) =>
  z.array(z.unknown()).transform((rows) =>
    rows.flatMap((value): T[] => {
      const parsed = row.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    }),
  );
