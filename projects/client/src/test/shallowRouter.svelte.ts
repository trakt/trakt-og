/* eslint-disable svelte/prefer-svelte-reactivity -- mirrors SvelteKit's page, whose URLs are replaced, never mutated */
import { vi } from 'vitest';

export const page = $state<{ url: URL; shallow: { url: URL } | null; state: object }>({
  url: new URL('https://og.trakt.tv/'),
  shallow: null,
  state: {},
});

// SvelteKit's shallow goto: page.url stays put, the target lands on page.shallow and page.state is a new object.
export const goto = vi.fn((href: string) => {
  page.shallow = { url: new URL(href, page.url) };
  page.state = {};
  return Promise.resolve();
});
