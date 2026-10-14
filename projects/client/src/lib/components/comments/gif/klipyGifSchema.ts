// FIXME(zod-4): og has one zod, the one @trakt/api depends on. See `src/lib/users/notes/noteRowsSchema.ts`.
import { z } from 'zod/v4';

const source = z.object({ url: z.string(), width: z.number(), height: z.number() });

// Klipy ships four sizes (hd/md/sm/xs) in five formats each. Only the two the picker shows are read.
const formats = z.object({ gif: source, webp: source.optional(), jpg: source.optional() });

export const klipyGifSchema = z.object({
  id: z.union([z.number(), z.string()]),
  slug: z.string(),
  title: z.string(),
  // Klipy mixes sponsored items into the same feed; only `gif` is a real GIF.
  type: z.literal('gif'),
  file: z.object({ md: formats, sm: formats }),
});

export type KlipyGif = z.infer<typeof klipyGifSchema>;
