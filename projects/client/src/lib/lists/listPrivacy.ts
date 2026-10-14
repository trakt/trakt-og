import type { Privacy } from '../notes/Privacy.ts';
import type { ListView } from './toListView.ts';

/** Who can see a list, and so its items' notes, from the list page's view of it. */
export function listPrivacy(list: Pick<ListView, 'isPublic' | 'shareLink' | 'pills'>): Privacy {
  if (list.isPublic) return 'public';
  if (list.shareLink) return 'link';
  if (list.pills.includes('Following')) return 'friends';
  return 'private';
}
