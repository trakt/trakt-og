import type { PickerList } from './PickerList.ts';

/**
 * A picker row's list page, under its owner. `/lists/:id` only resolves public lists, so a private one would 404; the
 * list page swaps the id for the slug.
 */
export const pickerListPath = (list: Pick<PickerList, 'id' | 'owner'>): string =>
  `/users/${encodeURIComponent(list.owner)}/lists/${list.id}`;
