import { describe, expect, it } from 'vitest';
import { toRobots } from './toRobots.ts';

const INDEX = 'index, follow, max-image-preview:large';
const NOINDEX = 'noindex, follow';
const robots = (routeId: string, extra: { status?: number; noindex?: boolean } = {}) =>
  toRobots({ routeId, status: extra.status ?? 200, noindex: extra.noindex });

describe('seo: toRobots', () => {
  it('should index the public pages', () => {
    const routes = [
      '/',
      '/about',
      '/discover',
      '/movies/[chart=chart]/[[period]]',
      '/shows/[chart=chart]/[[period]]',
      '/movies/boxoffice',
      '/calendars/[calendar=calendar]/[[start]]',
      '/lists/official/[slug]',
      '/users/[id]',
      '/users/[id]/lists/[list]',
    ];

    expect(routes.map((route) => robots(route))).toEqual(routes.map(() => INDEX));
  });

  describe('for titles and people', () => {
    it('should index summaries, seasons, episodes and their subpages', () => {
      const routes = [
        '/movies/[id]',
        '/movies/[id]/comments/[[sort_by]]',
        '/movies/[id]/releases',
        '/shows/[id]',
        '/shows/[id]/seasons/[season]',
        '/shows/[id]/seasons/[season]/episodes/[episode]',
        '/shows/[id]/seasons/[season]/episodes/[episode]/comments/[[sort_by]]',
        '/people/[id]',
        '/people/[id]/lists/[[type]]/[[sort_by]]/[[sort_how]]',
      ];

      expect(routes.map((route) => robots(route))).toEqual(routes.map(() => INDEX));
    });
  });

  describe('for comments', () => {
    it('should index a review', () => {
      expect(robots('/comments/[id]', { noindex: false })).toBe(INDEX);
    });

    it('should keep a short comment out but follow its links', () => {
      expect(robots('/comments/[id]', { noindex: true })).toBe(NOINDEX);
    });
  });

  it('should keep personal and utility pages out but follow their links', () => {
    const routes = [
      '/search/[[type=searchType]]',
      '/search/[type=searchType]/[id]',
      '/dashboard',
      '/calendars/my/[calendar=myCalendar]/[[start]]',
      '/signin',
      '/callback',
      '/signout',
      '/users/[id]/history/[[type=historyType]]/[...sort]',
      '/users/[id]/library/[[type=historyType]]/[...sort]',
      '/users/[id]/progress/[[type=progressType]]/[...sort]',
      '/users/[id]/ratings/[[type=ratingType]]/[...filters]',
      '/users/[id]/network/[[type=networkType]]/[[sort=networkSort]]',
      '/users/[id]/notes/[[type=noteType]]',
      '/users/[id]/comments/liked',
      '/users/[id]/lists/liked',
      '/users/[id]/lists/[list]/comments',
      '/_design',
    ];

    expect(routes.map((route) => robots(route))).toEqual(routes.map(() => NOINDEX));
  });

  it('should keep private content on a public route out', () => {
    expect(robots('/users/[id]', { noindex: true })).toBe(NOINDEX);
    expect(robots('/users/[id]/lists/[list]', { noindex: true })).toBe(NOINDEX);
  });

  it('should keep error pages and unmatched routes out', () => {
    expect(robots('/movies/[id]', { status: 404 })).toBe(NOINDEX);
    expect(toRobots({ routeId: null, status: 404 })).toBe(NOINDEX);
  });
});
