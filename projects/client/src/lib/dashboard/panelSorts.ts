import { type ListItemSort, listItemSorts } from '../lists/listItemSorts.ts';
import { smartListSorts } from '../lists/smart/smartListSorts.ts';
import { isBrowserSort } from '../lists/viewerSort.ts';
import type { ListPin } from './listPins.ts';

/**
 * A list panel's sort menu: the list page's, or a smart list page's, less the sorts the browser orders over the whole
 * list (My Watched, My Collected, My Plays), since a panel reads only its first page.
 */
export const panelSorts = (kind: ListPin['kind']): readonly ListItemSort[] =>
  (kind === 'smart' ? smartListSorts : listItemSorts).filter(({ by }) => !isBrowserSort(by));
