import { api } from '../api/api.ts';
import { fetchAllPages } from './fetchAllPages.ts';
import type { SitemapUrl } from './SitemapUrl.ts';
import { toTitleUrls } from './toTitleUrls.ts';

type FetchTitleUrlsParams = {
  fetch: typeof globalThis.fetch;
  type: 'movies' | 'shows';
};

// 8 pages of 250 is the 2,000 titles a sitemap lists.
const pages = { maxPages: 8 };
const query = (page: number) => ({ extended: 'full' as const, page, limit: 250 });

async function fetchMovies(client: ReturnType<typeof api>) {
  const [popular, watched] = await Promise.all([
    fetchAllPages({ ...pages, fetchPage: (page) => client.movies.popular({ query: query(page) }) }),
    fetchAllPages({
      ...pages,
      fetchPage: (page) => client.movies.watched({ params: { period: 'all' }, query: query(page) }),
    }),
  ]);
  if (!popular || !watched) return null;

  return [...popular.flat(), ...watched.flat().map(({ movie }) => movie)];
}

async function fetchShows(client: ReturnType<typeof api>) {
  const [popular, watched] = await Promise.all([
    fetchAllPages({ ...pages, fetchPage: (page) => client.shows.popular({ query: query(page) }) }),
    fetchAllPages({
      ...pages,
      fetchPage: (page) => client.shows.watched({ params: { period: 'all' }, query: query(page) }),
    }),
  ]);
  if (!popular || !watched) return null;

  return [...popular.flat(), ...watched.flat().map(({ show }) => show)];
}

/**
 * The movie or show pages a sitemap lists: what's popular now, then the most watched of all time, about 2,000 in all.
 * Popular alone is a few hundred titles. Public reads, so no token goes with them. Null when any page fails.
 */
export async function fetchTitleUrls({ fetch, type }: FetchTitleUrlsParams): Promise<SitemapUrl[] | null> {
  const client = api({ fetch });
  const titles = type === 'movies' ? await fetchMovies(client) : await fetchShows(client);

  return titles && toTitleUrls(type, titles);
}
