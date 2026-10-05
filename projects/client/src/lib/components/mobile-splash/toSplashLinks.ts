import { traktUrls } from '../../traktUrls.ts';
import type { MobilePlatform } from './MobilePlatform.ts';

type SplashApp = {
  readonly id: 'trakt-time' | 'showly' | 'rippple';
  readonly name: string;
  readonly href: string;
  /** Where it runs, shown next to the name. */
  readonly tag: string;
};

type SplashLinks = {
  /** Trakt's own app in the viewer's store. */
  readonly store: { readonly name: string; readonly href: string };
  readonly apps: ReadonlyArray<SplashApp>;
};

const STORES = {
  ios: { name: 'App Store', href: traktUrls.appStore },
  android: { name: 'Google Play', href: traktUrls.googlePlay },
} as const;

/** The splash's links for the viewer's phone: Trakt's store, then other apps that sync with Trakt. Rippple is iOS only. */
export function toSplashLinks(platform: MobilePlatform): SplashLinks {
  const ios = platform === 'ios';
  const apps: ReadonlyArray<SplashApp> = [
    { id: 'trakt-time', name: 'Trakt Time', href: traktUrls.traktTime, tag: 'Web' },
    {
      id: 'showly',
      name: 'Showly',
      href: ios ? traktUrls.showlyAppStore : traktUrls.showlyGooglePlay,
      tag: ios ? 'iOS' : 'Android',
    },
    { id: 'rippple', name: 'Rippple', href: traktUrls.ripppleAppStore, tag: 'iOS' },
  ];

  return { store: STORES[platform], apps: ios ? apps : apps.filter((app) => app.id !== 'rippple') };
}
