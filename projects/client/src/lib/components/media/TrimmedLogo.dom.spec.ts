import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import TrimmedLogo from './TrimmedLogo.svelte';

const mounted: Record<string, unknown>[] = [];

afterEach(() => {
  mounted.splice(0).forEach((component) => unmount(component));
  document.body.innerHTML = '';
});

describe('component: TrimmedLogo', () => {
  it('should show the title in place of a logo that is missing', () => {
    mounted.push(
      mount(TrimmedLogo, {
        target: document.body,
        props: { src: '/api/logo/shows/1/medium/logo.webp', alt: 'Severance' },
      }),
    );
    const image = document.querySelector('img');

    image?.dispatchEvent(new Event('error'));
    flushSync();

    expect(document.querySelector('img')).toBeNull();
    expect(document.body.textContent).toContain('Severance');
  });
});
