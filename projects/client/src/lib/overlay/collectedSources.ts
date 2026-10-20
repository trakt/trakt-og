import type { LibrarySource } from '../components/collection/LibrarySource.ts';

/** Every source across a show's or season's synced episodes, in the order they first appear. Undefined when none. */
export function collectedSources(lists: Iterable<readonly LibrarySource[]>): readonly LibrarySource[] | undefined {
  const sources = new Set([...lists].flat());
  return sources.size ? [...sources] : undefined;
}
