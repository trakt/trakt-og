import { describe, expect, it } from 'vitest';
import { stripStats } from './stripStats.ts';

const counts = [
  { count: 131_457, label: 'watchers' },
  { count: 150_002, label: 'plays' },
  { count: 11_734, label: 'libraries' },
  { count: 506, label: 'comments', href: '/movies/x/comments' },
  { count: 63_608, label: 'lists', href: '/movies/x/lists' },
  { count: 8_120, label: 'favorited' },
];

describe('stripStats', () => {
  it('should set favorites apart and put lists before comments', () => {
    const { favorited, community } = stripStats(counts);

    expect(favorited?.kind).toBe('favorited');
    expect(community.map(({ kind }) => kind)).toEqual(['watchers', 'plays', 'libraries', 'lists', 'comments']);
  });

  it('should title the tooltip with the label and give the exact count', () => {
    const { community } = stripStats(counts);

    expect(community.at(0)).toMatchObject({ label: 'watchers', detail: '131,457' });
    expect(community.at(3)).toMatchObject({ label: 'lists', detail: '63,608', href: '/movies/x/lists' });
  });

  it('should read singular labels', () => {
    const { community } = stripStats([
      { count: 1, label: 'library' },
      { count: 1, label: 'watcher' },
    ]);

    expect(community.map(({ kind, label }) => [kind, label])).toEqual([
      ['watchers', 'watcher'],
      ['libraries', 'library'],
    ]);
  });

  it('should drop zeros and labels it doesn’t know', () => {
    const { favorited, community } = stripStats([
      { count: 0, label: 'plays' },
      { count: 4, label: 'votes' },
    ]);

    expect(favorited).toBeUndefined();
    expect(community).toEqual([]);
  });
});
