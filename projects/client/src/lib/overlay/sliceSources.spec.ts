import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { sliceSources } from './sliceSources.ts';

const API = 'https://apiz.trakt.tv';
const seen: string[] = [];
const server = setupServer();
const get = (path: string) => rawApiFetch({ path, token: 't' });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

const ids = (trakt: number) => ({ ids: { trakt, slug: `s-${trakt}` }, title: 'Ignored' });

describe('sliceSources', () => {
  it('should map watched movies to their watch dates', async () => {
    server.use(http.get(`${API}/sync/watched/movies`, () => HttpResponse.json({ '12': ['2026-01-02', '2026-01-01'] })));

    const data = await sliceSources.watchedMovies.load(get);

    expect(data.get(12)).toEqual(['2026-01-02', '2026-01-01']);
  });

  it('should key watched show seasons by season number', async () => {
    server.use(
      http.get(`${API}/sync/watched/shows`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('season_numbers')).toBe('true');
        return HttpResponse.json({
          '1390': { '3572|0': { '500': ['2026-01-01'] }, '3573|1': { '501': ['2026-01-02'] } },
        });
      }),
    );

    const data = await sliceSources.watchedShows.load(get);

    expect(data.get(1390)?.get(0)?.get(500)).toEqual(['2026-01-01']);
    expect(data.get(1390)?.get(1)?.get(501)).toEqual(['2026-01-02']);
  });

  describe('when watched shows returns 413', () => {
    it('should page through with limit until a short page', async () => {
      const fullPage = Object.fromEntries(
        Array.from({ length: 500 }, (_, i) => [String(i + 1), { '1|1': { '1': ['d'] } }]),
      );
      server.use(
        http.get(`${API}/sync/watched/shows`, ({ request }) => {
          const params = new URL(request.url).searchParams;
          seen.push(`${params.get('limit')}:${params.get('page')}`);
          if (params.get('limit') === 'all') return HttpResponse.json({ error: 'too many' }, { status: 413 });
          return HttpResponse.json(params.get('page') === '1' ? fullPage : { '9999': { '1|1': { '1': ['d'] } } });
        }),
      );

      const data = await sliceSources.watchedShows.load(get);

      expect(seen).toEqual(['all:null', '500:1', '500:2']);
      expect(data.size).toBe(501);
    });
  });

  it('should map collected movies and shows, reading a numeric 3D flag as a boolean', async () => {
    server.use(
      http.get(`${API}/sync/collection/movies`, () =>
        HttpResponse.json([
          { movie: ids(7), collected_at: '2026-02-01', metadata: { media_type: 'bluray' } },
          { movie: ids(8), collected_at: '2026-02-02', metadata: { '3d': 1 } },
        ]),
      ),
      http.get(`${API}/sync/collection/shows`, () =>
        HttpResponse.json([
          {
            show: ids(3),
            seasons: [{ number: 1, episodes: [{ number: 2, collected_at: '2026-03-01' }] }],
          },
        ]),
      ),
    );

    expect((await sliceSources.collectedMovies.load(get)).get(7)).toEqual({
      at: '2026-02-01',
      metadata: { media_type: 'bluray' },
    });
    expect((await sliceSources.collectedMovies.load(get)).get(8)).toEqual({
      at: '2026-02-02',
      metadata: { '3d': true },
    });
    expect((await sliceSources.collectedShows.load(get)).get(3)?.get(1)?.get(2)).toEqual({ at: '2026-03-01' });
  });

  it('should keep the media servers collected movies were synced from', async () => {
    server.use(
      http.get(`${API}/sync/collection/movies`, () =>
        HttpResponse.json([
          { movie: ids(7), collected_at: '2026-02-01', available_on: [{ name: 'plex' }] },
          { movie: ids(8), collected_at: '2026-02-02', available_on: [] },
        ]),
      ),
    );

    const movies = await sliceSources.collectedMovies.load(get);

    expect(movies.get(7)).toEqual({ at: '2026-02-01', sources: ['plex'] });
    expect(movies.get(8)).toEqual({ at: '2026-02-02' });
  });

  it('should map synced episodes by show, season number and episode id', async () => {
    server.use(
      http.get(`${API}/sync/collection/minimal/shows`, ({ request }) => {
        seen.push(new URL(request.url).search);
        return HttpResponse.json({ '3': { '30|1': { '301': '2026-03-01|jellyfin', '302': '2026-03-02|emby' } } });
      }),
    );

    const synced = await sliceSources.syncedEpisodes.load(get);

    expect(seen).toEqual(['?available_on=digital&season_numbers=true']);
    expect(synced.get(3)?.get(1)?.get(301)).toEqual(['jellyfin']);
    expect(synced.get(3)?.get(1)?.get(302)).toEqual([]);
  });

  it('should fetch every page of a paginated slice', async () => {
    server.use(
      http.get(`${API}/sync/collection/shows`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? '1';
        seen.push(page);
        const show = { show: ids(Number(page)), seasons: [] };
        return HttpResponse.json([show], { headers: { 'X-Pagination-Page-Count': '3' } });
      }),
    );

    const data = await sliceSources.collectedShows.load(get);

    expect(seen.toSorted()).toEqual(['1', '2', '3']);
    expect([...data.keys()].toSorted()).toEqual([1, 2, 3]);
  });

  it('should group ratings by type', async () => {
    server.use(
      http.get(`${API}/sync/ratings`, () =>
        HttpResponse.json([
          { type: 'movie', rating: 8, movie: ids(1) },
          { type: 'episode', rating: 3, episode: ids(1) },
        ]),
      ),
    );

    const data = await sliceSources.ratings.load(get);

    expect(data.movie.get(1)).toBe(8);
    expect(data.episode.get(1)).toBe(3);
    expect(data.show.size).toBe(0);
  });

  it('should map the members the user follows and who follow them, by slug', async () => {
    const member = (slug: string | null) => ({ followed_at: '2026-09-29T12:00:00Z', user: { ids: { slug } } });
    server.use(
      http.get(`${API}/users/me/following`, () => HttpResponse.json([member('dorond'), member('ralffff')])),
      http.get(`${API}/users/me/followers`, () => HttpResponse.json([member('ralffff'), member(null)])),
    );

    expect(await sliceSources.network.load(get)).toEqual({
      following: new Set(['dorond', 'ralffff']),
      followers: new Set(['ralffff']),
    });
  });

  it('should map the minimal id endpoints', async () => {
    server.use(
      http.get(`${API}/sync/watchlist/seasons/rank/asc`, () => HttpResponse.json([{ season: ids(3) }])),
      http.get(`${API}/sync/watchlist/episodes/rank/asc`, () => HttpResponse.json([{ episode: ids(5) }])),
      http.get(`${API}/v3/users/me/watchlist/minimal`, () => HttpResponse.json({ movies: [1], shows: [2] })),
      http.get(`${API}/users/hidden/dropped`, () =>
        HttpResponse.json([{ type: 'show', show: ids(4), hidden_at: '2026-09-29T12:00:00Z' }]),
      ),
      http.get(`${API}/sync/favorites`, () =>
        HttpResponse.json([{ type: 'show', show: ids(5), id: 50, listed_at: '2026-09-29T12:00:00Z' }]),
      ),
      http.get(`${API}/users/hidden/progress_watched_reset`, () =>
        HttpResponse.json([{ type: 'show', show: ids(6), hidden_at: '2026-09-29T12:00:00Z' }]),
      ),
    );

    expect(await sliceSources.watchlist.load(get)).toEqual({
      movie: new Set([1]),
      show: new Set([2]),
      season: new Set([3]),
      episode: new Set([5]),
    });
    expect(await sliceSources.dropped.load(get)).toEqual(new Map([[4, '2026-09-29T12:00:00Z']]));
    expect(await sliceSources.favorites.load(get)).toEqual({
      movie: new Set(),
      show: new Set([5]),
      dates: { movie: new Map(), show: new Map([[5, '2026-09-29T12:00:00Z']]) },
    });
    expect(await sliceSources.rewatching.load(get)).toEqual(new Map([[6, '2026-09-29T12:00:00Z']]));
  });

  it('should collect list membership across every list', async () => {
    server.use(
      http.get(`${API}/v3/users/me/lists`, () => HttpResponse.json([{ id: 10 }, { id: 11 }])),
      http.get(`${API}/lists/10/items`, () =>
        HttpResponse.json([{ type: 'movie', movie: ids(1), id: 10, listed_at: '2026-09-29T12:00:00Z' }]),
      ),
      http.get(`${API}/lists/11/items`, () =>
        HttpResponse.json([
          { type: 'person', person: ids(2) },
          { type: 'show', show: ids(3) },
        ]),
      ),
    );

    const data = await sliceSources.listed.load(get);

    expect(data.movie).toEqual(new Set([1]));
    expect(data.show).toEqual(new Set([3]));
    expect(data).not.toHaveProperty('person');
  });

  it('should throw when a slice request fails', async () => {
    server.use(http.get(`${API}/users/hidden/dropped`, () => HttpResponse.json({}, { status: 500 })));

    await expect(sliceSources.dropped.load(get)).rejects.toThrow('500');
  });

  describe('when a body does not match its schema', () => {
    it.each([
      ['watchedMovies', `${API}/sync/watched/movies`, { '12': 'nope' }],
      ['watchedShows', `${API}/sync/watched/shows`, [{ show: 1 }]],
      ['ratings', `${API}/sync/ratings`, [{ type: 'movie', movie: ids(1) }]],
      ['likedLists', `${API}/users/me/likes/lists`, [{ list: { ids: {} } }]],
      ['listed', `${API}/v3/users/me/lists`, { id: 10 }],
    ] as const)('should throw for %s like a failed request', async (name, url, body) => {
      server.use(http.get(url, () => HttpResponse.json(body)));

      await expect(sliceSources[name].load(get)).rejects.toThrow();
    });
  });
});
