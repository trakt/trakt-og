import { describe, expect, it } from 'vitest';
import { toExternalRatings } from './toExternalRatings.ts';

const ratings = {
  imdb: { rating: 8.84, votes: 2_567_341, link: 'https://www.imdb.com/title/tt0137523' },
  tmdb: { rating: 8.437, votes: 32_938, link: 'https://www.themoviedb.org/movie/550' },
  metascore: { rating: 67, link: 'https://www.imdb.com/title/tt0137523/criticreviews' },
  rotten_tomatoes: {
    rating: 81,
    state: 'fresh',
    user_rating: 96,
    user_state: 'upright',
    link: 'https://www.rottentomatoes.com/m/fight_club',
  },
};

describe('toExternalRatings', () => {
  it('should list every site with a score, in OG order', () => {
    const result = toExternalRatings({
      ratings,
      rank: { rank: 74, delta: 15, link: 'https://www.justwatch.com/us/movie/x' },
    });

    expect(result.map(({ logo, rating, title, detail }) => [logo, rating, title, detail])).toEqual([
      ['imdb', '8.8', 'IMDb', '2,567,341 votes'],
      ['tmdb', '84%', 'TMDB', '32,938 votes'],
      ['tomatometer-fresh', '81%', 'Rotten Tomatoes', 'Tomatometer · Fresh'],
      ['audience-upright', '96%', 'Rotten Tomatoes', 'Popcornmeter'],
      ['metacritic', '67', 'Metacritic', 'Metascore'],
      ['justwatch', '74', 'JustWatch', '30 Day Streaming Rank'],
    ]);
    expect(result.at(-1)?.change).toEqual({ text: '+15', trend: 'up' });
    expect(result.at(0)?.href).toBe('https://www.imdb.com/title/tt0137523/ratings');
    expect(result.map(({ score }) => score)).toEqual([88, 84, 81, 96, 67, undefined]);
  });

  it('should put Letterboxd after IMDb, its five stars scaled to 100', () => {
    const result = toExternalRatings({
      ratings: {
        ...ratings,
        letterboxd: { rating: 3.14, votes: 1234, link: 'https://letterboxd.com/film/fight-club' },
      },
    });
    expect(result.map(({ logo }) => logo).slice(0, 3)).toEqual(['imdb', 'letterboxd', 'tmdb']);
    expect(result.at(1)).toMatchObject({ title: 'Letterboxd', rating: '3.1', score: 62, detail: '1,234 votes' });
  });

  it('should skip Letterboxd without a score or a link', () => {
    const logos = (letterboxd: { rating: number; link: string | null }) =>
      toExternalRatings({ ratings: { letterboxd } }).map(({ logo }) => logo);
    expect(logos({ rating: 0, link: 'x' })).toEqual([]);
    expect(logos({ rating: 4, link: null })).toEqual([]);
  });

  it('should skip sites without a score or a link', () => {
    const result = toExternalRatings({
      ratings: { imdb: { rating: 0, votes: 0, link: 'x' }, tmdb: { rating: 7, votes: 1, link: null } },
      rank: { rank: null, delta: null, link: 'x' },
    });

    expect(result).toEqual([]);
  });

  it('should pick the Rotten Tomatoes logo from the state and score', () => {
    const logos = (state: string, rating: number, userState: string) =>
      toExternalRatings({
        ratings: { rotten_tomatoes: { rating, state, user_rating: 50, user_state: userState, link: 'x' } },
      }).map(({ logo }) => logo);

    expect(logos('certified', 95, 'certified')).toEqual(['tomatometer-certified', 'audience-certified']);
    expect(logos('rotten', 30, 'spilled')).toEqual(['tomatometer-rotten', 'audience-spilled']);
    expect(logos('rotten', 60, '')).toEqual(['tomatometer-fresh', 'audience-upright']);
  });

  it('should band the metascore', () => {
    const band = (rating: number) =>
      toExternalRatings({ ratings: { metascore: { rating, link: 'x' } } }).at(0)?.metascore;

    expect([band(70), band(40), band(39)]).toEqual(['high', 'medium', 'low']);
  });

  it('should sign the rank change and mark which way it went', () => {
    const change = (delta: number | null) =>
      toExternalRatings({ ratings: null, rank: { rank: 1, delta, link: 'x' } }).at(0)?.change;

    expect([change(1_204), change(-113), change(0), change(null)]).toEqual([
      { text: '+1,204', trend: 'up' },
      { text: '-113', trend: 'down' },
      { text: '0', trend: 'flat' },
      undefined,
    ]);
  });

  it('should say vote for a single vote', () => {
    const result = toExternalRatings({ ratings: { imdb: { rating: 7, votes: 1, link: 'x' } } });

    expect(result.at(0)?.detail).toBe('1 vote');
  });
});
