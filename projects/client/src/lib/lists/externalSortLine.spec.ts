import { describe, expect, it } from 'vitest';
import { isExternalSort, toExternalSortLine } from './externalSortLine.ts';

const ratings = {
  imdb: { rating: 8.3, votes: 998_068, link: 'https://www.imdb.com/title/tt0113277' },
  tmdb: { rating: 7.9, votes: 7000, link: 'https://www.themoviedb.org/movie/949' },
  rotten_tomatoes: { rating: 88, user_rating: 94, state: 'certified', link: 'https://www.rottentomatoes.com/m/heat' },
  metascore: { rating: 76, link: 'https://www.metacritic.com/movie/heat' },
};

describe('util: externalSortLine', () => {
  it('should know the site sorts', () => {
    expect(['imdb_rating', 'tmdb_votes', 'rt_audience', 'metascore'].every(isExternalSort)).toBe(true);
    expect(isExternalSort('percentage')).toBe(false);
  });

  it('should show the score and votes, the same for a rating sort and a votes sort', () => {
    const line = toExternalSortLine('imdb_rating', ratings);
    expect(line).toEqual({ logo: 'imdb', title: 'IMDb', rating: '8.3', votes: '998k votes' });
    expect(toExternalSortLine('imdb_votes', ratings)).toEqual(line);
    expect(toExternalSortLine('tmdb_rating', ratings)).toMatchObject({ rating: '79%', votes: '7.0k votes' });
  });

  it('should show only the score where the site has no votes', () => {
    expect(toExternalSortLine('rt_tomatometer', ratings)).toEqual({
      logo: 'tomatometer-certified',
      title: 'Rotten Tomatoes',
      rating: '88%',
    });
    expect(toExternalSortLine('metascore', ratings)).toEqual({
      logo: 'metacritic',
      title: 'Metacritic',
      rating: '76',
      metascore: 'high',
    });
  });

  it('should leave the line blank when the site has no score', () => {
    expect(toExternalSortLine('rt_audience', { ...ratings, rotten_tomatoes: null })).toBeNull();
    expect(toExternalSortLine('imdb_rating', null)).toBeNull();
  });
});
