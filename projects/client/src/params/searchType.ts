import { searchTypes } from '../lib/components/header/searchTypes.ts';
import { retiredSearchTypes } from '../lib/search/retiredSearchTypes.ts';

/** A `/search/<type>` tab: shows, people, imdb... Shows & Movies is bare `/search`. A retired tab, which redirects. */
export function match(param: string): boolean {
  return searchTypes.some((type) => type.slug !== '' && type.slug === param) || retiredSearchTypes.includes(param);
}
