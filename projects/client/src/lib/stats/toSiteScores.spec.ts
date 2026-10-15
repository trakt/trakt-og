import { describe, expect, it } from 'vitest';
import { toExternalRatings } from '../components/summary/toExternalRatings.ts';
import { toSiteScores } from './toSiteScores.ts';

const external = toExternalRatings({
  ratings: {
    imdb: { rating: 6.8, votes: 1, link: 'https://www.imdb.com/title/tt1104001' },
    tmdb: { rating: 6.5, votes: 1, link: 'https://www.themoviedb.org/movie/20526' },
    rotten_tomatoes: { rating: 51, state: 'rotten', user_rating: 71, user_state: 'upright', link: 'https://rt' },
    metascore: { rating: 49, link: 'https://mc' },
  },
  rank: { rank: 6211, delta: 4, link: 'https://jw' },
});

describe('toSiteScores', () => {
  it('should score each site out of 100 against Trakt, in brand colors, without JustWatch', () => {
    expect(toSiteScores({ external, trakt: 71 }).map(({ brand, score, diff }) => [brand, score, diff.text, diff.trend]))
      .toEqual([
        ['imdb', 68, '−3', 'down'],
        ['tmdb', 65, '−6', 'down'],
        ['rotten-tomatoes', 51, '−20', 'down'],
        ['rotten-tomatoes', 71, '0', 'flat'],
        ['metacritic', 49, '−22', 'down'],
      ]);
  });

  it('should color Letterboxd in its own brand', () => {
    const withLetterboxd = toExternalRatings({
      ratings: { letterboxd: { rating: 3.14, votes: 1, link: 'https://letterboxd.com/film/tron-legacy' } },
    });
    expect(toSiteScores({ external: withLetterboxd, trakt: 71 }).at(0)).toMatchObject({
      brand: 'letterboxd',
      score: 62,
    });
  });

  it('should mark a site above Trakt with a plus and name the gap in words', () => {
    const [imdb] = toSiteScores({ external, trakt: 67 });
    expect(imdb?.diff).toEqual({ text: '+1', trend: 'up', label: '1 point above Trakt' });
  });
});
