import type { HistoryType } from '../history/historyTypes.ts';
import type { LibrarySort } from './librarySort.ts';

/** OG's `library_user_path` after `/library`: All Types and the default sort (newest Added Date) stay out of it. */
export function libraryPath(type: HistoryType, sort: LibrarySort): string {
  if (sort.by !== 'added' || sort.how !== 'asc') return `/${type}/${sort.by}/${sort.how}`;
  return type === 'all' ? '' : `/${type}`;
}
