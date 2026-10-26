import type { CollectionMetadata } from './CollectionMetadata.ts';
import type { LibrarySource } from './LibrarySource.ts';

/** What a library tooltip says: when it was added (or how many episodes are in), its format and its media server. */
export type LibraryTipData = Readonly<{
  /** Movies and episodes: "Sep 29, 2026", or null for OG's unknown date. */
  added?: string | null;
  /** Shows and seasons. */
  episodes?: Readonly<{ done: number; aired: number }>;
  metadata?: CollectionMetadata | null;
  sources?: readonly LibrarySource[];
}>;
