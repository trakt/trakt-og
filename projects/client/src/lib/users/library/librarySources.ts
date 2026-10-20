/**
 * The library's Source dropdown: All, then v3's Digital / Custom toggle as Media Center / Other. Other is anything no
 * synced server holds, including old plugin syncs, so it isn't called Manual. Each option asks for its `available_on`.
 */
export const librarySources = {
  all: { label: 'All', availableOn: undefined },
  digital: { label: 'Media Center', availableOn: 'digital' },
  other: { label: 'Other', availableOn: 'other' },
} as const;

export type LibrarySourceFilter = keyof typeof librarySources;

export const isLibrarySourceFilter = (value: string | null): value is LibrarySourceFilter =>
  value !== null && Object.hasOwn(librarySources, value);
