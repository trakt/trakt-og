import type { MediaImageSlot } from './MediaImageSlot.ts';
import type { MediaImageType } from './MediaImageType.ts';

/** One art a link preview may use: an item's slot on media.trakt.tv. */
export interface PreviewArtRef {
  readonly type: MediaImageType;
  readonly id: number;
  readonly slot: MediaImageSlot;
}
