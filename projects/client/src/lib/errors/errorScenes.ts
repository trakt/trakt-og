import et from '$lib/assets/errors/et.webp';
import gameOfThrones from '$lib/assets/errors/game-of-thrones.webp';
import haltAndCatchFire from '$lib/assets/errors/halt-and-catch-fire.webp';
import interstellar from '$lib/assets/errors/interstellar.webp';
import severance from '$lib/assets/errors/severance.webp';
import type { ErrorSceneTheme } from '$lib/components/error/ErrorSceneTheme';
import type { ErrorSceneKey } from './ErrorSceneKey.ts';

type ErrorScene = {
  /** For the tab: "Page Not Found (404) - Trakt", as OG titled its error pages. */
  readonly title: string;
  readonly name: string;
  readonly body: string;
  /** Ahead of status and support. home: back to the start. retry: load it again. reconnect: try again or stay. */
  readonly actions: 'home' | 'retry' | 'reconnect';
  readonly theme: ErrorSceneTheme;
};

const winterfell: ErrorSceneTheme = {
  source: 'Game of Thrones',
  href: '/shows/game-of-thrones',
  quote: 'Come, my lord, you are a long way from home and winter is coming.',
  art: gameOfThrones,
  artPosition: '50% 30%',
  tint: '--color-error-scene-winterfell',
  accent: '--color-error-scene-winterfell-accent',
  motion: 'snow',
};

/** og's own errors, one per kind it can raise, each dressed as a show or movie. */
export const errorScenes: Readonly<Record<ErrorSceneKey, ErrorScene>> = {
  notFound: {
    title: 'Page Not Found',
    name: 'Page not found',
    body: "This page doesn't exist or has moved. Head home to find what you were after.",
    actions: 'home',
    theme: winterfell,
  },
  badLink: {
    title: 'Broken Link',
    name: 'Broken link',
    body: "This link is broken, so there's no page to show. Head home to find what you were after.",
    actions: 'home',
    theme: winterfell,
  },
  broken: {
    title: 'Server Error',
    name: 'Something broke',
    body: "Something broke on our side and this page didn't load. Try again, or check Trakt's status.",
    actions: 'retry',
    theme: {
      source: 'The Matrix',
      href: '/movies/the-matrix-1999',
      quote: "Never send a human to do a machine's job.",
      speaker: 'Agent Smith',
      tint: '--color-error-scene-matrix',
      accent: '--color-error-scene-matrix-accent',
      motion: 'code',
    },
  },
  upstream: {
    title: 'Trakt API Error',
    name: 'Trakt API error',
    body: "Trakt's servers sent back an error, so this page couldn't load. Try again in a moment.",
    actions: 'retry',
    theme: {
      source: 'Halt and Catch Fire',
      href: '/shows/halt-and-catch-fire',
      quote: "Computers aren't the thing. They're the thing that gets us to the thing.",
      speaker: 'Joe MacMillan',
      art: haltAndCatchFire,
      artPosition: '50% 40%',
      tint: '--color-error-scene-cardiff',
      accent: '--color-error-scene-cardiff-accent',
      motion: 'scanlines',
    },
  },
  maintenance: {
    title: 'Down for Maintenance',
    name: 'Down for maintenance',
    body: "Trakt's servers are down for maintenance or overloaded. Check Trakt's status for updates.",
    actions: 'retry',
    theme: {
      source: 'Severance',
      href: '/shows/severance',
      quote: 'The work is mysterious and important.',
      speaker: 'Mark S.',
      art: severance,
      artPosition: '50% 40%',
      tint: '--color-error-scene-lumon',
      accent: '--color-error-scene-lumon-accent',
      motion: 'numbers',
    },
  },
  timeout: {
    title: 'Timed Out',
    name: 'Timed out',
    body: 'Trakt took too long to answer. Try again in a moment.',
    actions: 'retry',
    theme: {
      source: 'Interstellar',
      href: '/movies/interstellar-2014',
      quote: "This little maneuver's gonna cost us 51 years.",
      speaker: 'Cooper',
      art: interstellar,
      tint: '--color-error-scene-endurance',
      accent: '--color-error-scene-endurance-accent',
      motion: 'stars',
    },
  },
  offline: {
    title: 'Offline',
    name: 'No connection',
    body: "You're offline. This page loads as soon as your connection is back.",
    actions: 'reconnect',
    theme: {
      source: 'E.T. the Extra-Terrestrial',
      href: '/movies/e-t-the-extra-terrestrial-1982',
      quote: 'E.T. phone home.',
      art: et,
      tint: '--color-error-scene-elliott',
      accent: '--color-error-scene-elliott-accent',
      motion: 'fireflies',
    },
  },
};
