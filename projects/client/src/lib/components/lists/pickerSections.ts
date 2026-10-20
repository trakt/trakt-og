import type { PickerList } from './PickerList.ts';
import { sortPickerLists } from './sortPickerLists.ts';

export interface PickerSection {
  readonly key: 'listed' | 'mine' | 'shared';
  readonly title: string;
  /** Row ids in order; 0 is the watchlist. */
  readonly ids: readonly number[];
}

/** The picker's groups when it opens. Rows keep these places while they're toggled and move on the next open. */
export function pickerSections(lists: readonly PickerList[], watchlisted: boolean): PickerSection[] {
  const sorted = sortPickerLists(lists);
  const ids = (rows: PickerList[]) => rows.map(({ id }) => id);
  return [
    { key: 'listed', title: 'Listed on', ids: [...(watchlisted ? [0] : []), ...ids(sorted.filter((l) => l.selected))] },
    {
      key: 'mine',
      title: 'Your lists',
      ids: [...(watchlisted ? [] : [0]), ...ids(sorted.filter((l) => !l.selected && !l.collaboration))],
    },
    { key: 'shared', title: 'Collaborating', ids: ids(sorted.filter((l) => !l.selected && l.collaboration)) },
  ];
}
