import { z } from 'zod/v4';
import type { LibrarySource } from './LibrarySource.ts';

const KNOWN: readonly LibrarySource[] = ['plex', 'jellyfin'];

/**
 * `available_on` from `extended=available_on`: the media servers an item came from, in a fixed order. Names og has no
 * icon for are dropped, and an item added by hand has none.
 */
export const librarySourcesSchema = z.array(z.object({ name: z.string() })).nullish().transform((rows) =>
  KNOWN.filter((source) => rows?.some((row) => row.name === source))
);
