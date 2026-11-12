import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { previewHead } from './previewHead.ts';

const server = setupServer(http.get('*', () => new HttpResponse(null, { status: 404 })));
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const SHOW = {
  title: 'Severance',
  year: 2022,
  ids: { trakt: 7, slug: 'severance' },
  overview: 'Mark leads a team of office workers.',
  genres: ['drama'],
  first_aired: '2022-02-18T08:00:00.000Z',
  certification: 'TV-MA',
  status: 'returning series',
};
const SEASON = { number: 2, ids: { trakt: 71 }, title: 'Season 2', first_aired: '2025-01-17T08:00:00.000Z' };
const TITLED_SEASON = { ...SEASON, title: 'Delicate' };
const EPISODE = {
  season: 2,
  number: 3,
  title: 'Who Is Alive?',
  ids: { trakt: 701 },
  overview: 'Mark searches.',
  first_aired: '2025-01-24T08:00:00.000Z',
};
const PERSON = {
  name: 'Adam Scott',
  ids: { trakt: 9, slug: 'adam-scott' },
  biography: 'An American actor.',
};
const TRON = {
  title: 'TRON',
  year: 1982,
  ids: { trakt: 1, slug: 'tron-1982' },
  overview: 'A hacker is abducted.',
  released: '1982-07-09',
};
const COLLECTION = { name: 'TRON Collection', ids: { trakt: 5, slug: 'tron-collection' }, item_count: 40 };
const COMMENT = {
  id: 12,
  comment: 'Loved it. [spoiler]He dies[/spoiler]',
  spoiler: false,
  review: false,
  parent_id: 0,
  replies: 0,
  user: { username: 'justin', name: 'Justin', private: false, deleted: false, ids: { trakt: 3, slug: 'justin' } },
};

type Reply = Parameters<typeof HttpResponse.json>[0];
const routes: Readonly<Record<string, Reply>> = {
  '/shows/severance': SHOW,
  '/shows/severance/seasons/2/info': TITLED_SEASON,
  '/shows/severance/seasons/2/episodes/3': EPISODE,
  '/people/adam-scott': PERSON,
  '/movies/tron-1982': TRON,
  '/movies/tron-1982/lists/official/popular': [COLLECTION],
  '/comments/12': COMMENT,
  '/comments/12/item': { type: 'movie', movie: TRON },
};

function api(overrides: Record<string, Reply> = {}) {
  const reads: string[] = [];
  const replies = { ...routes, ...overrides };
  server.use(
    http.get('https://apiz.trakt.tv/*', ({ request }) => {
      const pathname = new URL(request.url).pathname.replace(/\/$/, '');
      reads.push(pathname);
      return pathname in replies ? HttpResponse.json(replies[pathname]) : new HttpResponse(null, { status: 404 });
    }),
  );
  return reads;
}

const preview = (path: string, routeId: string, params: Record<string, string>) =>
  previewHead({
    routeId,
    params,
    url: new URL(`https://og.trakt.tv${path}`),
    fetch: globalThis.fetch,
    now: new Date('2026-11-12T00:00:00Z'),
  });

const meta = (html: string, property: string) =>
  new RegExp(`<meta (?:property|name)="${property}" content="([^"]*)"`).exec(html)?.at(1);

const show = { id: 'severance' };
const season = { ...show, season: '2' };
const episode = { ...season, episode: '3' };

describe('previewHead for a show', () => {
  it("should give the show page's head from one read", async () => {
    const reads = api();

    const html = await (await preview('/shows/severance', '/shows/[id]', show)).text();

    expect(reads).toEqual(['/shows/severance']);
    expect(meta(html, 'og:title')).toBe('Severance (2022)');
    expect(meta(html, 'og:description')).toBe(SHOW.overview);
    expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/show/7/fanart/show/7/poster');
  });

  it("should name a subpage by the item's title, as the real page does", async () => {
    api();

    const html = await (await preview('/shows/severance/stats', '/shows/[id]/stats', show)).text();

    expect(meta(html, 'og:title')).toBe('Severance: Stats');
  });

  it('should name its seasons and episodes pages by the full title', async () => {
    api();

    const seasons = await (await preview('/shows/severance/seasons', '/shows/[id]/seasons', show)).text();
    const all = await (await preview('/shows/severance/seasons/all', '/shows/[id]/seasons/all', show)).text();

    expect(meta(seasons, 'og:title')).toBe('Severance (2022): Seasons');
    expect(meta(all, 'og:title')).toBe('Severance (2022): Episodes');
  });

  it('should answer a missing show with a 404', async () => {
    const response = await preview('/shows/nope', '/shows/[id]', { id: 'nope' });

    expect(response.status).toBe(404);
  });
});

describe('previewHead for a season', () => {
  it("should give the season page's head from two reads", async () => {
    const reads = api();

    const html = await (await preview('/shows/severance/seasons/2', '/shows/[id]/seasons/[season]', season)).text();

    expect(reads.toSorted()).toEqual(['/shows/severance', '/shows/severance/seasons/2/info']);
    expect(meta(html, 'og:title')).toBe('Severance: Delicate');
    expect(meta(html, 'og:description')).toBe(SHOW.overview);
    expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/season/71/poster/show/7/fanart');
  });

  it('should step a subpage up through its show, with its own title after the season number', async () => {
    api();

    const html = await (
      await preview('/shows/severance/seasons/2/people', '/shows/[id]/seasons/[season]/people', season)
    ).text();

    expect(meta(html, 'og:title')).toBe('Severance Season 2: People');
    expect(html).toContain('"item":"https://og.trakt.tv/shows/severance/people"');
  });

  it('should answer a season the show lacks with a 404', async () => {
    api();

    const response = await preview('/shows/severance/seasons/9', '/shows/[id]/seasons/[season]', {
      ...season,
      season: '9',
    });

    expect(response.status).toBe(404);
  });
});

describe('previewHead for an episode', () => {
  it("should give the episode page's head from three reads", async () => {
    const reads = api();

    const html = await (
      await preview('/shows/severance/seasons/2/episodes/3', '/shows/[id]/seasons/[season]/episodes/[episode]', episode)
    ).text();

    expect(reads.toSorted()).toEqual([
      '/shows/severance',
      '/shows/severance/seasons/2/episodes/3',
      '/shows/severance/seasons/2/info',
    ]);
    expect(meta(html, 'og:title')).toBe('Severance S02E03: Who Is Alive?');
    expect(meta(html, 'og:description')).toBe(EPISODE.overview);
    expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/episode/701/screenshot/show/7/fanart');
  });

  it('should name a subpage by its item and step up through the show and season', async () => {
    api();

    const html = await (
      await preview(
        '/shows/severance/seasons/2/episodes/3/comments',
        '/shows/[id]/seasons/[season]/episodes/[episode]/comments/[[sort_by]]',
        episode,
      )
    ).text();

    expect(meta(html, 'og:title')).toBe('Severance 2x03 &quot;Who Is Alive?&quot;: Comments');
    expect(html).toContain('"item":"https://og.trakt.tv/shows/severance/seasons/2/comments"');
  });

  it('should answer a missing episode with a 404', async () => {
    const response = await preview(
      '/shows/severance/seasons/2/episodes/99',
      '/shows/[id]/seasons/[season]/episodes/[episode]',
      { ...episode, episode: '99' },
    );

    expect(response.status).toBe(404);
  });
});

describe('previewHead for a person', () => {
  it("should give the person page's head from one read", async () => {
    const reads = api();

    const html = await (await preview('/people/adam-scott', '/people/[id]', { id: 'adam-scott' })).text();

    expect(reads).toEqual(['/people/adam-scott']);
    expect(meta(html, 'og:title')).toBe('Adam Scott');
    expect(meta(html, 'og:description')).toBe('An American actor.');
    expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/person/9/headshot');
  });

  it("should give the person's lists page its own title", async () => {
    api();

    const html = await (
      await preview('/people/adam-scott/lists', '/people/[id]/lists/[[type]]/[[sort_by]]/[[sort_how]]', {
        id: 'adam-scott',
      })
    ).text();

    expect(meta(html, 'og:title')).toBe('Adam Scott: Lists');
  });

  it('should answer a missing person with a 404', async () => {
    expect((await preview('/people/nobody', '/people/[id]', { id: 'nobody' })).status).toBe(404);
  });
});

describe('previewHead for a movie subpage', () => {
  it("should step up through the movie's collection, as the real subpage does", async () => {
    const reads = api();

    const html = await (await preview('/movies/tron-1982/stats', '/movies/[id]/stats', { id: 'tron-1982' })).text();

    expect(reads.toSorted()).toEqual(['/movies/tron-1982', '/movies/tron-1982/lists/official/popular']);
    expect(meta(html, 'og:title')).toBe('TRON (1982): Stats');
    expect(html).toContain('https://og.trakt.tv/lists/official/tron-collection');
  });

  it('should name release dates by the movie alone, from one read', async () => {
    const reads = api();

    const html = await (
      await preview('/movies/tron-1982/releases', '/movies/[id]/releases', { id: 'tron-1982' })
    ).text();

    expect(reads).toEqual(['/movies/tron-1982']);
    expect(meta(html, 'og:title')).toBe('TRON (1982): Release Dates');
  });
});

describe('previewHead for a comment', () => {
  it("should give the comment page's head from two reads, and keep a shout out of search", async () => {
    const reads = api();

    const html = await (await preview('/comments/12', '/comments/[id]', { id: '12' })).text();

    expect(reads.toSorted()).toEqual(['/comments/12', '/comments/12/item']);
    expect(meta(html, 'og:title')).toBe('Comment by Justin on TRON (1982)');
    expect(meta(html, 'og:description')).toBe('Loved it. [spoiler]');
    expect(meta(html, 'og:image')).toBe('https://og.trakt.tv/api/art/movie/1/poster');
    expect(meta(html, 'robots')).toBe('noindex, follow');
  });

  it('should leave a review indexable', async () => {
    api({ '/comments/12': { ...COMMENT, review: true } });

    const html = await (await preview('/comments/12', '/comments/[id]', { id: '12' })).text();

    expect(meta(html, 'robots')).not.toContain('noindex');
  });

  it('should answer a missing comment with a 404', async () => {
    expect((await preview('/comments/99', '/comments/[id]', { id: '99' })).status).toBe(404);
  });
});
