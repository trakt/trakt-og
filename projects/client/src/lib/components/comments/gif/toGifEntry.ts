import type { GifEntry } from './GifEntry.ts';
import type { KlipyGif } from './klipyGifSchema.ts';

export function toGifEntry(gif: KlipyGif): GifEntry {
  return {
    id: `${gif.id}`,
    slug: gif.slug,
    title: gif.title,
    preview: gif.file.sm.webp ?? gif.file.sm.gif,
    full: gif.file.md.webp ?? gif.file.md.gif,
    still: gif.file.sm.jpg,
  };
}
