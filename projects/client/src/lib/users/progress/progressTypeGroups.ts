import type { ProgressType } from './progressTypes.ts';

/** The status dropdown's groups: the shows' tabs, then the movies'. */
export const progressTypeGroups: readonly { readonly label: string; readonly types: readonly ProgressType[] }[] = [
  { label: 'Shows', types: ['watched', 'rewatching', 'dropped'] },
  { label: 'Movies', types: ['franchises'] },
];
