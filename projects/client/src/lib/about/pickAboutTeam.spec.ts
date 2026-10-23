import { describe, expect, it } from 'vitest';
import type { AboutFavorite } from './AboutFavorite.ts';
import type { AboutMember } from './AboutMember.ts';
import { pickAboutTeam } from './pickAboutTeam.ts';

const favorite = (n: number, fanart: boolean): AboutFavorite => ({
  key: `movie-${n}`,
  title: `Movie ${n}`,
  year: 2000 + n,
  href: `/movies/${n}`,
  poster: `p${n}.webp`,
  fanart: fanart ? `f${n}.webp` : null,
});

const member = (favorites: AboutFavorite[]): AboutMember => ({
  slug: 'justin',
  username: 'justin',
  name: 'Justin',
  avatar: 'a.jpg',
  location: null,
  since: 2010,
  favorites,
  episodes: 1,
  movies: 1,
});

describe('pickAboutTeam', () => {
  it('should show five favorites at most, shuffled', () => {
    const favorites = Array.from({ length: 10 }, (_, n) => favorite(n, true));
    const [picked] = pickAboutTeam({ team: [member(favorites)], random: () => 0.99 });

    expect(picked?.favorites).toHaveLength(5);
    expect(picked?.favorites.map((f) => f.key)).not.toEqual(favorites.slice(0, 5).map((f) => f.key));
  });

  it('should keep them in order when the shuffle leaves every card in place', () => {
    const favorites = Array.from({ length: 3 }, (_, n) => favorite(n, true));
    const [picked] = pickAboutTeam({ team: [member(favorites)], random: () => 0 });

    expect(picked?.favorites.map((f) => f.key)).toEqual(['movie-0', 'movie-1', 'movie-2']);
    expect(picked?.cover).toBe('f0.webp');
  });

  it('should take the cover from the first shuffled favorite that has fanart', () => {
    const [picked] = pickAboutTeam({ team: [member([favorite(0, false), favorite(1, true)])], random: () => 0 });

    expect(picked?.cover).toBe('f1.webp');
  });

  it('should shuffle the team order too', () => {
    const team = ['a', 'b', 'c'].map((slug) => ({ ...member([]), slug }));

    expect(pickAboutTeam({ team, random: () => 0.99 }).map((one) => one.slug)).toEqual(['c', 'a', 'b']);
    expect(pickAboutTeam({ team, random: () => 0 }).map((one) => one.slug)).toEqual(['a', 'b', 'c']);
  });

  it('should have no cover without favorites', () => {
    expect(pickAboutTeam({ team: [member([])], random: Math.random }).at(0)?.cover).toBeNull();
  });
});
