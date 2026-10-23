import type { LinkedMedia } from '../components/summary/LinkedMedia.ts';

/** OG's Wikipedia search for a show and its seasons and episodes: "Breaking Bad 2008 TV Series". */
export function showSearch(show: Pick<LinkedMedia, 'title' | 'year'>): string {
  return `${show.year ? `${show.title} ${show.year}` : show.title} TV Series`;
}
