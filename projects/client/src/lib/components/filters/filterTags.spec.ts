import { describe, expect, it } from 'vitest';
import { emptyFilters } from './advancedFilters.ts';
import { filterTags, filterValueLabel } from './filterTags.ts';

describe('util: filterValueLabel', () => {
  it('should name values the way OG did', () => {
    expect(filterValueLabel('genres', 'science-fiction')).toBe('Science Fiction');
    expect(filterValueLabel('certifications', 'tv-ma')).toBe('TV-MA');
    expect(filterValueLabel('status', 'returning series')).toBe('Returning Series');
    expect(filterValueLabel('languages', 'ja')).toBe('Japanese');
    expect(filterValueLabel('countries', 'us')).toBe('United States');
    expect(filterValueLabel('networks', 'A&E')).toBe('A&E');
  });

  it('should fall back to the code for one it can not name', () => {
    expect(filterValueLabel('languages', 'xx')).toBe('XX');
  });
});

const kept = (text: string) => ({ text, without: false });

describe('util: filterTags', () => {
  it('should list a mixed list as one tag, kept values before the left-out ones', () => {
    const genres = { values: ['drama', 'comedy'], mode: 'any', excluded: ['crime'] } as const;
    expect(filterTags({ ...emptyFilters, genres })).toEqual([
      { id: 'genres', values: [kept('Drama'), kept('Comedy'), { text: 'Crime', without: true }] },
    ]);
  });

  it("should list one tag per filter in OG's order, excluded ones marked", () => {
    const tags = filterTags({
      ...emptyFilters,
      genres: { values: ['drama'], mode: 'none' },
      countries: { values: ['jp'], mode: 'any' },
      years: [2000, 2010],
      runtimes: [30, 60],
      ratings: [70, 100],
      imdb_ratings: [7, 10],
      rt_user_meters: [60, 100],
    });
    expect(tags).toEqual([
      { id: 'genres', values: [{ text: 'Drama', without: true }] },
      { id: 'countries', values: [kept('Japan')] },
      { id: 'years', values: [kept('2000 - 2010')] },
      { id: 'runtimes', values: [kept('30 - 60 mins')] },
      { id: 'ratings', values: [kept('70 - 100%')], site: 'trakt' },
      { id: 'imdb_ratings', values: [kept('7.0 - 10.0')], site: 'imdb' },
      { id: 'rt_user_meters', values: [kept('60 - 100%')], site: 'rt-audience' },
    ]);
  });

  it('should lead the TMDB, Letterboxd and MyAnimeList ranges with their logos', () => {
    const tags = filterTags({
      ...emptyFilters,
      tmdb_ratings: [7, 10],
      letterboxd_ratings: [3.5, 5],
      mal_ratings: [8, 10],
    });
    expect(tags).toEqual([
      { id: 'tmdb_ratings', values: [kept('7.0 - 10.0')], site: 'tmdb' },
      { id: 'letterboxd_ratings', values: [kept('3.5 - 5.0')], site: 'letterboxd' },
      { id: 'mal_ratings', values: [kept('8.0 - 10.0')], site: 'mal' },
    ]);
  });

  describe('for the parental guide', () => {
    it('should name a preset', () => {
      const kids = { nudity: 0, violence: 1, profanity: 0, alcohol: 0, frightening: 1 } as const;
      expect(filterTags({ ...emptyFilters, parental: kids })).toEqual([{ id: 'parental', values: [kept('Kids')] }]);
    });

    it('should list each limited category of a custom mix', () => {
      expect(filterTags({ ...emptyFilters, parental: { nudity: 0, violence: 2, frightening: 3 } })).toEqual([
        {
          id: 'parental',
          values: [kept('Nudity None'), kept('Violence up to Moderate'), kept('Frightening up to Severe')],
        },
      ]);
    });
  });
});
