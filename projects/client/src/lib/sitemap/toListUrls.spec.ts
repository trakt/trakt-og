import { describe, expect, it } from 'vitest';
import { toListUrls } from './toListUrls.ts';

const user = { username: 'Sean', private: false, deleted: false, ids: { slug: 'sean' } };
const list = (trakt: number, overrides: object = {}) => ({
  type: 'personal',
  privacy: 'public',
  updated_at: '2026-10-20T07:46:07.000Z',
  ids: { trakt, slug: `list-${trakt}` },
  user,
  ...overrides,
});

describe('mapper: toListUrls', () => {
  it("should link a community list under its owner and date it by the list's updated_at", () => {
    expect(toListUrls([list(1)])).toEqual([{ path: '/users/sean/lists/list-1', lastmod: '2026-10-20T07:46:07Z' }]);
  });

  it('should link an official list by its slug', () => {
    const official = list(2, { type: 'official', user: { ...user, username: 'Trakt', ids: { slug: null } } });

    expect(toListUrls([official])).toEqual([{ path: '/lists/official/list-2', lastmod: '2026-10-20T07:46:07Z' }]);
  });

  it('should leave out lists that are not public or whose owner is private or deleted', () => {
    const lists = [
      list(1, { privacy: 'private' }),
      list(2, { privacy: 'link' }),
      list(3, { user: { ...user, private: true } }),
      list(4, { user: { ...user, deleted: true } }),
      list(5),
    ];

    expect(toListUrls(lists).map(({ path }) => path)).toEqual(['/users/sean/lists/list-5']);
  });

  it('should leave out an official list whose slug opens a personal list instead', () => {
    const official = list(37675689, { type: 'official', user: { ...user, username: 'Trakt', ids: { slug: null } } });

    expect(toListUrls([official, list(5)]).map(({ path }) => path)).toEqual(['/users/sean/lists/list-5']);
  });

  it('should keep the first of each list, in order', () => {
    expect(toListUrls([list(1), list(2), list(1)]).map(({ path }) => path)).toEqual([
      '/users/sean/lists/list-1',
      '/users/sean/lists/list-2',
    ]);
  });
});
