import type { CollectionMetadata } from '../components/collection/CollectionMetadata.ts';
import type { LibrarySource } from '../components/collection/LibrarySource.ts';

/** Date strings from older caches remain readable until the versioned collection activity refetches them. */
export type CollectedItem =
  | string
  | Readonly<{ at: string; id?: number; metadata?: CollectionMetadata; sources?: readonly LibrarySource[] }>;
