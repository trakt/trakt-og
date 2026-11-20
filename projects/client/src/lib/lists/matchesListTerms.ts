import type { ListItemRow } from './listItemRowsSchema.ts';

const titlesOf = (row: ListItemRow) => {
  switch (row.type) {
    case 'movie':
      return [row.movie.title];
    case 'show':
      return [row.show.title];
    case 'season':
      return [row.show.title, row.season.title];
    case 'episode':
      return [row.show.title, row.episode.title];
    case 'person':
      return [row.person.name];
  }
};

/**
 * The list page's Filter by Title, which the worker no longer applies: every word of the terms appears in the item's
 * title, or its show's. No terms keeps every item.
 */
export function matchesListTerms(row: ListItemRow, terms: string | undefined): boolean {
  const words = (terms ?? '').toLocaleLowerCase('en').split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = titlesOf(row).filter(Boolean).join(' ').toLocaleLowerCase('en');
  return words.every((word) => text.includes(word));
}
