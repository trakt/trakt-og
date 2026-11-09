import type { ListResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toListTabs } from './toListTabs.ts';

const list = (trakt: number, slug: string, extra: Partial<ListResponse> = {}): ListResponse => ({
  name: slug,
  description: null,
  privacy: 'public',
  share_link: '',
  type: 'official',
  display_numbers: false,
  allow_comments: true,
  sort_by: 'rank',
  sort_how: 'asc',
  created_at: '2020-01-01T00:00:00.000Z',
  updated_at: '2020-01-01T00:00:00.000Z',
  item_count: 250,
  comment_count: 0,
  likes: 0,
  ids: { trakt, slug },
  user: { username: 'trakt', name: 'Trakt', private: false, deleted: false, ids: { slug: 'trakt', trakt: 1 } },
  ...extra,
});

const ids = (tabs: ReturnType<typeof toListTabs>) => tabs.map((tab) => [tab.id, tab.lists.map(({ id }) => id)]);

describe('toListTabs', () => {
  it('should put the collection first among the official lists', () => {
    const official = [
      list(1, 'imdb-top-rated-movies'),
      list(2, '1001-movies-you-must-see-before-you-die'),
      list(3, 'trakt-popular-movies'),
      list(4, 'toy-story-collection', { item_count: 5 }),
    ];
    const personal = [list(10, 'pixar', { type: 'personal' })];

    expect(ids(toListTabs({ official, personal, mine: [], limit: 3 }))).toEqual([
      ['official', [4, 1, 2]],
      ['personal', [10]],
    ]);
  });

  it('should keep the API order when there is no collection', () => {
    const official = [list(1, 'imdb-top-rated-tv-shows'), list(2, 'trakt-popular-tv-shows')];

    expect(ids(toListTabs({ official, personal: [], mine: [], limit: 3 }))).toEqual([['official', [1, 2]]]);
  });

  it('should leave out Official when the title is on no official list', () => {
    const personal = [list(10, 'heist-night', { type: 'personal' })];

    expect(ids(toListTabs({ official: [], personal, mine: [], limit: 3 }))).toEqual([['personal', [10]]]);
  });

  it('should count every official list, not just the three shown', () => {
    const official = Array.from({ length: 11 }, (_, i) => list(i + 1, `chart-${i + 1}`));

    expect(toListTabs({ official, personal: [], mine: [], limit: 3 }).at(0)?.total).toBe(11);
  });

  it("should show the viewer's own personal lists as Mine, most liked first", () => {
    const mine = [
      list(20, 'watchlist', { type: 'watchlist' }),
      list(21, 'rewatch-pile', { type: 'personal', likes: 1 }),
      list(22, 'favorites-of-the-90s', { type: 'personal', likes: 5 }),
    ];

    expect(toListTabs({ official: [], personal: [], mine, limit: 3 })).toMatchObject([
      { id: 'me', label: 'Mine', total: 2, lists: [{ id: 22 }, { id: 21 }] },
    ]);
  });
});
