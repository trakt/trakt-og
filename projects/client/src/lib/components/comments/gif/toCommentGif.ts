import type { GifEntry } from './GifEntry.ts';

/** What a comment posts for a picked GIF: the medium one, with its size so readers can hold its box. */
export function toCommentGif(gif: GifEntry | null): { url: string; width: number; height: number } | undefined {
  return gif ? { url: gif.full.url, width: gif.full.width, height: gif.full.height } : undefined;
}
