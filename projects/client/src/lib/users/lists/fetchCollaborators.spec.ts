import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PLACEHOLDER_AVATAR } from '../../components/comments/authorOf.ts';
import { fetchCollaborators } from './fetchCollaborators.ts';

const ENDPOINT = 'https://apiz.trakt.tv/lists/42/collaborators';
const server = setupServer(
  http.get(ENDPOINT, () =>
    HttpResponse.json([
      {
        username: 'alex889',
        name: ' Coco ',
        ids: { slug: 'alex889' },
        images: { avatar: { full: 'https://a.jpg' } },
        vip: true,
        vip_ep: true,
      },
      { username: 'sean', name: null, ids: { slug: null } },
    ])),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchCollaborators', () => {
  it('should name each collaborator like OG, with their avatar, profile and VIP label', async () => {
    expect(await fetchCollaborators({ fetch, listId: 42 })).toEqual([
      {
        slug: 'alex889',
        name: 'Coco',
        href: '/users/alex889',
        avatar: 'https://a.jpg',
        vip: { kind: 'vip', tag: { text: 'EP', title: 'Executive Producer' }, years: null },
      },
      { slug: 'sean', name: 'sean', href: '/users/sean', avatar: PLACEHOLDER_AVATAR, vip: null },
    ]);
  });

  it('should treat a private list, a failure or an odd body as no collaborators', async () => {
    server.use(http.get(ENDPOINT, () => new HttpResponse('List is private or does not exist', { status: 403 })));
    expect(await fetchCollaborators({ fetch, listId: 42 })).toEqual([]);
    server.use(http.get(ENDPOINT, () => HttpResponse.json({ nope: true })));
    expect(await fetchCollaborators({ fetch, listId: 42 })).toEqual([]);
    server.use(http.get(ENDPOINT, () => HttpResponse.error()));
    expect(await fetchCollaborators({ fetch, listId: 42 })).toEqual([]);
  });
});
