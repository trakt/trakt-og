import { type SearchListType, searchListTypes } from './searchListTypes.ts';

type Params = {
  /** The search tab's path segment, empty for Shows & Movies. */
  slug: string;
  query: string;
  /** The list type an empty Lists search browses. */
  listType?: SearchListType;
};

// OG named the tab by its model: Show, Movie, Person...
const META_TYPES: Readonly<Record<string, string>> = {
  shows: 'Show',
  movies: 'Movie',
  people: 'Person',
  lists: 'List',
};

/** A search page's head. */
export function toSearchSeo({ slug, query, listType }: Params): { title: string; description: string } {
  const browsed = searchListTypes.find(({ value }) => value === listType);
  if (browsed) {
    return {
      title: browsed.title,
      description: `The most liked and discussed ${browsed.label.toLowerCase()} on Trakt.`,
    };
  }

  const metaType = META_TYPES[slug];
  if (metaType) {
    return {
      title: `${metaType} search results for ${query}`,
      description: `${metaType} search results for movies, TV shows, lists, and people.`,
    };
  }

  return { title: `Search results for ${query}`, description: 'Search results for movies and TV shows.' };
}
