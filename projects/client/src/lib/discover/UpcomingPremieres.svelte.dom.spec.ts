import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { startBrokenImages } from '#lib/images/brokenImageFallback.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import type { Premiere } from './toPremieres.ts';
import UpcomingPremieres from './UpcomingPremieres.svelte';

vi.mock('#lib/api/apiEnvironment.ts', () => ({ apiEnvironment: () => ({}) }));

const premiere: Premiere = {
  key: 'show-1',
  id: 1,
  href: '/shows/trinity',
  title: 'Trinity',
  logo: 'https://media.trakt.tv/shows/1/medium/logo.webp',
  fanart: 'https://media.trakt.tv/shows/1/medium/fanart.webp',
  at: '2026-11-30T02:00:00.000Z',
  day: '2026-11-30',
  kind: 'series',
  season: 1,
  votes: 0,
};

// happy-dom has no `document.images`.
beforeAll(() => {
  Object.defineProperty(document, 'images', { configurable: true, get: () => [...document.querySelectorAll('img')] });
});

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  document.body.innerHTML = '';
});

const render = () => {
  const component = mount(UpcomingPremieres, {
    target: document.body,
    props: { premieres: [premiere], today: '2026-11-20', datePreferences: {} as DatePreferences },
  });
  cleanups.push(
    () => unmount(component),
    startBrokenImages(document, async () => false),
  );
  flushSync();
};

const shownName = () => document.querySelector('.card:has(.logo[data-fallback]) .name')?.textContent;

describe('component: UpcomingPremieres', () => {
  it("should show the show's name where its logo failed to load", () => {
    render();
    document.querySelector('.logo')?.dispatchEvent(new Event('error'));

    expect(shownName()).toBe('Trinity');
  });
});
