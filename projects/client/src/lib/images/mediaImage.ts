import { mediaFolder } from './mediaFolder.ts';
import type { MediaImageSlot } from './MediaImageSlot.ts';
import type { MediaImageType } from './MediaImageType.ts';

// Art drawn as words or a strip comes in medium and full only.
const NO_THUMB: ReadonlySet<MediaImageSlot> = new Set(['logo', 'clearart', 'banner']);

interface MediaImageParams {
  readonly type: MediaImageType;
  readonly id: number;
  readonly slot: MediaImageSlot;
  readonly size: 'thumb' | 'medium' | 'full';
  /** Art to try when this one is missing, like the show's poster for a season's (`brokenImageFallback`). */
  readonly fallback?: string;
}

/**
 * A Trakt image's URL, built from the item's Trakt id: media.trakt.tv keeps every image at
 * `{type}/{id}/{size}/{slot}.webp`. The URL doesn't say whether the art exists. A missing one is a 404 that keeps its
 * placeholder, or tries `fallback` first, which rides in the URL's fragment. A thumb logo, clearart or banner is the
 * medium one, the smallest made.
 */
export function mediaImage({ type, id, slot, size, fallback }: MediaImageParams): string {
  const folder = size === 'thumb' && NO_THUMB.has(slot) ? 'medium' : size;
  const url = `${mediaFolder(type, id)}/${folder}/${slot}.webp`;
  return fallback ? `${url}#fallback=${encodeURIComponent(fallback)}` : url;
}
