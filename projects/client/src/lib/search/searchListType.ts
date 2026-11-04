import { type SearchListType, searchListTypes } from './searchListTypes.ts';

/** The `?type=` an empty Lists search browses. Missing or unknown, it's All. */
export function searchListType(value: string | null): SearchListType {
  return searchListTypes.find((type) => type.value === value)?.value ?? 'all';
}
