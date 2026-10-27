import { type ListItemSort, listItemSorts, type ListItemType } from './listItemSorts.ts';

type VisibleListSortsParams = {
  /** The chosen types. Empty is All Types. */
  types: readonly ListItemType[];
  signedIn: boolean;
};

/**
 * The sort menu the viewer sees: sorts that don't apply to any chosen type left out, and "Your data" only when
 * signed in.
 */
export function visibleListSorts({ types, signedIn }: VisibleListSortsParams): readonly ListItemSort[] {
  return listItemSorts
    .filter((sort) => !sort.types || types.length === 0 || types.some((type) => sort.types?.includes(type)))
    .filter((sort) => signedIn || sort.group !== 'mine');
}
