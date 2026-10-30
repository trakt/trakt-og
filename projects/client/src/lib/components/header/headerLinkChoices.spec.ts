import { describe, expect, it } from 'vitest';
import { headerLinkChoices } from './headerLinkChoices.ts';
import { headerLinkPrefs } from './headerLinkPrefs.ts';

describe('headerLinkChoices', () => {
  const choices = headerLinkChoices({ slug: 'sean', signedIn: true });
  const byId = (id: string) => choices.find((link) => link.id === id);

  it('should start with the default bar', () => {
    expect(choices.slice(0, 5).map(({ id }) => id)).toEqual(headerLinkPrefs.DEFAULTS);
  });

  it('should give every link its own id', () => {
    expect(new Set(choices.map(({ id }) => id)).size).toBe(choices.length);
  });

  it("should link the viewer's profile pages", () => {
    expect(byId('profile')).toMatchObject({ href: '/users/sean', exact: true });
    expect(byId('watchlist')).toMatchObject({ title: 'Watchlist', href: '/users/sean/watchlist', group: 'profile' });
  });

  it('should name charts by their type in the bar and by the chart in the picker', () => {
    expect(byId('movies-watched')).toMatchObject({
      title: 'Most Watched Movies',
      label: 'Watched',
      href: '/movies/watched',
    });
    expect(byId('shows-library')).toMatchObject({ title: 'Shows in Libraries', label: 'Libraries', group: 'shows' });
  });

  it('should offer Box Office for movies only', () => {
    expect(byId('movies-boxoffice')).toMatchObject({ href: '/movies/boxoffice', group: 'movies' });
    expect(byId('shows-boxoffice')).toBeUndefined();
  });

  it('should offer the My calendars, then the All calendars', () => {
    expect(choices.filter(({ group }) => group === 'my-calendars')).toHaveLength(8);
    expect(choices.filter(({ group }) => group === 'all-calendars')).toHaveLength(6);
    expect(byId('calendar-my-shows-movies')).toMatchObject({ title: 'My Shows & Movies', label: 'Shows & Movies' });
    expect(byId('calendar-premieres')).toMatchObject({
      title: 'All Premieres',
      label: 'Premieres',
      href: '/calendars/premieres',
    });
    expect(byId('calendar-my-dvd')).toMatchObject({ title: 'My DVD & Blu-ray', href: '/calendars/my/dvd' });
  });

  it("should leave the viewer's recommendations out of their pages", () => {
    expect(byId('recommendations')).toBeUndefined();
  });

  describe('for a visitor', () => {
    const visitor = headerLinkChoices({ slug: null, signedIn: false });

    it('should leave out Dashboard, the profile pages and the My calendars', () => {
      expect(visitor.some(({ group }) => group === 'profile')).toBe(false);
      expect(visitor.some(({ id }) => id.startsWith('calendar-my-'))).toBe(false);
      expect(visitor.map(({ id }) => id).slice(0, 4)).toEqual(['discover', 'shows', 'movies', 'calendar']);
    });

    it('should open Calendar on the premieres', () => {
      expect(visitor.find(({ id }) => id === 'calendar')?.href).toBe('/calendars/premieres');
    });
  });
});
