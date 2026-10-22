import { z } from 'zod/v4';

/** The hero's `HomeFanart` list as the shared cache keeps it, read back from JSON. */
export const homeFanartsSchema = z.array(
  z.object({ key: z.string(), title: z.string(), href: z.string(), image: z.string() }),
);
