import { describe, expect, it } from 'vitest';
import { traktUrls } from '../../traktUrls.ts';
import { toSplashLinks } from './toSplashLinks.ts';

describe('mapper: toSplashLinks', () => {
  describe('for iOS', () => {
    const links = toSplashLinks('ios');

    it('should link Trakt in the App Store', () => {
      expect(links.store).toEqual({ name: 'App Store', href: traktUrls.appStore });
    });

    it('should list Trakt Time, Showly and Rippple in that order', () => {
      expect(links.apps.map((app) => app.name)).toEqual(['Trakt Time', 'Showly', 'Rippple']);
    });

    it('should link Showly in the App Store', () => {
      expect(links.apps.find((app) => app.id === 'showly')).toMatchObject({
        href: traktUrls.showlyAppStore,
        tag: 'iOS',
      });
    });
  });

  describe('for Android', () => {
    const links = toSplashLinks('android');

    it('should link Trakt in Google Play', () => {
      expect(links.store).toEqual({ name: 'Google Play', href: traktUrls.googlePlay });
    });

    it('should leave out Rippple, which is iOS only', () => {
      expect(links.apps.map((app) => app.name)).toEqual(['Trakt Time', 'Showly']);
    });

    it('should link Showly in Google Play', () => {
      expect(links.apps.find((app) => app.id === 'showly')).toMatchObject({
        href: traktUrls.showlyGooglePlay,
        tag: 'Android',
      });
    });
  });
});
