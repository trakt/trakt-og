import type {
  MovieResponse,
  PeopleMovieCreditsResponse,
  PeopleShowCreditsResponse,
  PersonResponse,
  ShowResponse,
} from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toPersonSummary } from './toPersonSummary.ts';

const fanart = (slug: string) => ({ fanart: [`media.trakt.tv/images/${slug}/fanarts/medium/a.jpg.webp`] });
const movie = (slug: string, trakt: number, extra: Partial<MovieResponse> = {}) =>
  ({ title: slug, year: 2010, ids: { slug, trakt }, ...extra }) as MovieResponse;
const show = (slug: string, trakt: number, extra: Partial<ShowResponse> = {}) =>
  ({ title: slug, year: 2008, ids: { slug, trakt }, ...extra }) as ShowResponse;

const person = {
  name: 'Bryan Cranston',
  ids: { slug: 'bryan-cranston', trakt: 1, imdb: 'nm0186505', tmdb: 17419 },
  biography: 'From Wikipedia, the free encyclopedia.  Bryan Lee Cranston\n is an actor.',
  birthday: '1956-03-07',
  gender: 'male',
  known_for_department: 'acting',
  social_ids: { twitter: 'BryanCranston', wikipedia: 'Bryan_Cranston' },
} as PersonResponse;

const movies = {
  cast: [
    {
      movie: movie('drive-2011', 10, {
        released: '2011-09-16',
        rating: 7.5,
        images: fanart('drive') as MovieResponse['images'],
      }),
      characters: ['Shannon'],
      character: 'Shannon',
    },
    { movie: movie('argo-2012', 11, { released: '2012-10-12' }), characters: ["Jack O'Donnell"], character: '' },
  ],
  crew: {
    directing: [{ movie: movie('drive-2011', 10, { released: '2011-09-16' }), jobs: ['Director'], job: 'Director' }],
  },
} as PeopleMovieCreditsResponse;

const shows = {
  cast: [{
    show: show('breaking-bad', 20, { first_aired: '2008-01-20T02:00:00.000Z', aired_episodes: 62, runtime: 47 }),
    characters: ['Walter White', 'Walter White'],
    character: 'Walter White',
    episode_count: 62,
    series_regular: true,
  }],
  crew: {
    production: [{ show: show('breaking-bad', 20), jobs: ['Producer'], job: 'Producer', episode_count: 5 }],
    directing: [{ show: show('malcolm-in-the-middle', 21), jobs: ['Director'], job: 'Director', episode_count: 3 }],
  },
} as PeopleShowCreditsResponse;

const base = {
  person,
  movies,
  shows,
  knownFor: [],
  listCount: 3,
  random: 0,
  now: new Date('2026-09-29T00:00:00Z'),
};

describe('toPersonSummary', () => {
  it('should put the departments in tabs, most credits first, each newest first', () => {
    const { departments, defaultDepartment } = toPersonSummary(base);

    expect(departments.map(({ id, label, credits }) => [id, label, credits.length])).toEqual([
      ['acting', 'Acting', 3],
      ['directing', 'Directing', 2],
      ['production', 'Production', 1],
    ]);
    expect(departments.at(0)?.credits.map(({ href }) => href)).toEqual([
      '/movies/argo-2012',
      '/movies/drive-2011',
      '/shows/breaking-bad',
    ]);
    expect(defaultDepartment).toBe('acting');
  });

  it('should dedupe characters, count episodes and total a show runtime', () => {
    const breakingBad = toPersonSummary(base).departments.at(0)?.credits.at(2);

    expect(breakingBad).toMatchObject({
      characters: 'Walter White',
      episodeCount: 62,
      released: true,
      sortBy: { runtime: 47 * 62, episodes: 62, title: 'breaking-bad' },
    });
  });

  it('should hide the rating and show the status of a movie that is not out', () => {
    const upcoming = movie('the-upcoming', 12, { released: '2027-01-01', status: 'post production', rating: 8 });
    const credit = toPersonSummary({
      ...base,
      movies: { cast: [{ movie: upcoming, characters: [], character: '' }] },
      shows: null,
    }).departments.at(0)?.credits.at(0);

    expect(credit).toMatchObject({ released: false, status: 'Post Production', rating: undefined, characters: '' });
  });

  it('should sort an undated credit ahead of everything, like OG', () => {
    const undated = movie('rumored', 13, { status: 'rumored' });
    const credits = toPersonSummary({
      ...base,
      movies: { cast: [...(movies.cast ?? []), { movie: undated, characters: [], character: '' }] },
    }).departments.at(0)?.credits;

    expect(credits?.at(0)?.sortBy.released).toBe('3000-01-01');
  });

  it('should caption the fanart with the character and the department', () => {
    expect(toPersonSummary(base).fanart).toEqual({
      image: 'https://media.trakt.tv/images/drive/fanarts/full/a.jpg.webp',
      caption: { characters: 'Shannon', role: 'Acting', title: 'drive-2011', year: 2010, href: '/movies/drive-2011' },
    });
  });

  it("should pass over the person's own fanart, a portrait poster", () => {
    const own = { ...person, images: fanart('people/1') as PersonResponse['images'] };
    expect(toPersonSummary({ ...base, person: own }).fanart?.image).toBe(
      'https://media.trakt.tv/images/drive/fanarts/full/a.jpg.webp',
    );
  });

  it('should pick the fanart from the Known For row when any of it has fanart', () => {
    const famous = movie('godzilla-2014', 12, {
      released: '2014-05-16',
      images: fanart('godzilla') as MovieResponse['images'],
    });
    const summary = toPersonSummary({
      ...base,
      movies: {
        ...movies,
        cast: [...(movies.cast ?? []), { movie: famous, characters: ['Joe Brody'], character: '' }],
      },
      knownFor: [{ type: 'movie', movie: { ids: { trakt: 12 } } }],
    });

    expect(summary.knownFor.map(({ id }) => id)).toEqual([12]);
    expect(summary.fanart?.caption?.title).toBe('godzilla-2014');
  });

  it('should caption a Known For fanart with the role played, not a crew job on the same title', () => {
    const bad = show('breaking-bad', 20, {
      first_aired: '2008-01-20T02:00:00.000Z',
      images: fanart('breaking-bad') as ShowResponse['images'],
    });
    const summary = toPersonSummary({
      ...base,
      movies: null,
      shows: {
        cast: [{
          show: bad,
          characters: ['Walter White'],
          character: 'Walter White',
          episode_count: 62,
          series_regular: true,
        }],
        crew: { production: [{ show: bad, jobs: ['Producer'], job: 'Producer', episode_count: 5 }] },
      } as PeopleShowCreditsResponse,
      knownFor: [{ type: 'show', show: { ids: { trakt: 20 } } }],
    });

    expect(summary.fanart?.caption).toMatchObject({ characters: 'Walter White', role: 'Acting' });
  });

  it('should fall back to any credit when none in the known-for department has fanart', () => {
    const summary = toPersonSummary({ ...base, person: { ...person, known_for_department: 'writing' } });

    expect(summary.fanart?.caption?.role).toBe('Acting');
    expect(summary.defaultDepartment).toBe('acting');
  });

  it('should have no fanart without credits', () => {
    expect(toPersonSummary({ ...base, movies: null, shows: null }).fanart).toBeUndefined();
  });

  it('should strip the Wikipedia byline from the biography', () => {
    expect(toPersonSummary(base).biography).toBe('Bryan Lee Cranston is an actor.');
  });

  it('should count the age to the day they died', () => {
    const summary = toPersonSummary({ ...base, person: { ...person, birthday: '1930-05-31', death: '2000-05-30' } });

    expect(summary.facts.age).toBe(69);
    expect(toPersonSummary(base).facts.age).toBe(70);
  });

  it('should hide an unknown gender and spell out non-binary', () => {
    expect(toPersonSummary({ ...base, person: { ...person, gender: 'unknown' } }).facts.gender).toBeUndefined();
    expect(toPersonSummary({ ...base, person: { ...person, gender: 'non_binary' } }).facts.gender).toBe('Non-binary');
  });

  it('should link out to IMDB, TMDB, Wikipedia and socials', () => {
    expect(toPersonSummary(base).links.map(({ label, href }) => [label, href])).toEqual([
      ['IMDB', 'https://www.imdb.com/name/nm0186505'],
      ['TMDB', 'https://www.themoviedb.org/person/17419'],
      ['Wikipedia', 'https://en.wikipedia.org/wiki/Bryan_Cranston'],
      ['Twitter', 'https://twitter.com/BryanCranston'],
    ]);
  });

  it('should search IMDB and Wikipedia for someone with no ids', () => {
    const summary = toPersonSummary({
      ...base,
      person: { ...person, ids: { slug: 'jo', trakt: 2 }, name: 'Jo Doe', social_ids: null },
    });

    expect(summary.links.map(({ href }) => href)).toEqual([
      'https://www.imdb.com/find?q=Jo+Doe&s=nm',
      'https://duckduckgo.com/?q=!wikipedia%20Jo%20Doe',
    ]);
  });
});
