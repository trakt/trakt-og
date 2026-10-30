import { describe, expect, it } from 'vitest';
import { currentHeaderLink } from './currentHeaderLink.ts';
import { headerLinkChoices } from './headerLinkChoices.ts';

describe('currentHeaderLink', () => {
  const choices = headerLinkChoices({ slug: 'sean', signedIn: true });
  const bar = (...ids: string[]) => ids.flatMap((id) => choices.filter((link) => link.id === id));
  const main = bar('dashboard', 'discover', 'shows', 'movies', 'calendar');

  it('should select the main link by its first path segment', () => {
    expect(currentHeaderLink(main, '/shows/popular')).toBe('shows');
    expect(currentHeaderLink(main, '/calendars/premieres')).toBe('calendar');
    expect(currentHeaderLink(main, '/dashboard')).toBe('dashboard');
  });

  it('should select nothing off the bar', () => {
    expect(currentHeaderLink(main, '/users/sean/history')).toBeUndefined();
  });

  it('should prefer the link whose own page this is', () => {
    expect(currentHeaderLink(bar('movies', 'movies-boxoffice'), '/movies/boxoffice')).toBe('movies-boxoffice');
    expect(currentHeaderLink(bar('movies', 'movies-watched'), '/movies/watched/monthly')).toBe('movies-watched');
    expect(currentHeaderLink(bar('movies', 'movies-watched'), '/movies/popular')).toBe('movies');
  });

  it('should select a profile page and the pages under it', () => {
    expect(currentHeaderLink(bar('history', 'lists'), '/users/sean/lists/123-favorites')).toBe('lists');
    expect(currentHeaderLink(bar('history', 'lists'), '/users/sean/history/movies')).toBe('history');
  });

  it('should select Profile on the profile alone', () => {
    expect(currentHeaderLink(bar('profile'), '/users/sean')).toBe('profile');
    expect(currentHeaderLink(bar('profile'), '/users/sean/ratings')).toBeUndefined();
  });

  it('should not match a longer slug', () => {
    expect(currentHeaderLink(bar('profile', 'history'), '/users/seanfan/history')).toBeUndefined();
  });
});
