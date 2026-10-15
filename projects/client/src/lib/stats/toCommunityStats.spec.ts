import { describe, expect, it } from 'vitest';
import { toCommunityStats } from './toCommunityStats.ts';

const stats = { watchers: 89_734, plays: 109_418, collectors: 228_960, comments: 88, lists: 24_193, favorited: 781 };
const params = { stats, href: '/movies/tron-legacy-2010', favorites: true, released: true };

describe('toCommunityStats', () => {
  it('should put favorites first and say what each count means next to the watchers', () => {
    expect(toCommunityStats(params).map(({ title, value, note }) => [title, value, note])).toEqual([
      ['Favorites', '781', '0.9% of watchers'],
      ['Watchers', '89.7k', '89,734 people'],
      ['Plays', '109k', '1.22 per watcher'],
      ['Libraries', '229k', '2.6× watchers'],
      ['Lists', '24.2k', '24,193 lists'],
      ['Comments', '88', '88 comments'],
    ]);
  });

  it('should give exact counts for screen readers and link lists and comments to their pages', () => {
    const tiles = toCommunityStats(params);
    expect(tiles.at(1)?.exact).toBe('89,734');
    expect(tiles.filter(({ href }) => href).map(({ href }) => href)).toEqual([
      '/movies/tron-legacy-2010/lists',
      '/movies/tron-legacy-2010/comments',
    ]);
  });

  it('should fall back to exact counts with no watchers', () => {
    const tiles = toCommunityStats({ ...params, stats: { ...stats, watchers: 0, favorited: 1, collectors: 1 } });
    expect(tiles.map(({ note }) => note).slice(0, 4)).toEqual(['1 favorite', '0 people', '109,418 plays', '1 library']);
  });

  it('should leave favorites out where the API has none, and keep only lists before release', () => {
    expect(toCommunityStats({ ...params, favorites: false }).map(({ kind }) => kind)).not.toContain('favorited');
    expect(toCommunityStats({ ...params, released: false }).map(({ kind }) => kind)).toEqual(['lists']);
  });
});
