// FIXME(zod-4): see noteRowsSchema.ts. og has one zod, the one @trakt/api depends on.
import { z } from 'zod/v4';

/** A show's or movie's `?extended=images` summary, read only for its fanart. */
export const fanartSchema = z.object({
  images: z.object({ fanart: z.array(z.string()).nullish() }).nullish(),
});
