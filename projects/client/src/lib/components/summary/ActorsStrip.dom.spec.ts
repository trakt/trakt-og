import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ActorsStrip from './ActorsStrip.svelte';
import type { CastMember } from './CastMember.ts';

const mounted: Record<string, unknown>[] = [];

// happy-dom has no popovers; picking a group closes the dropdown's.
HTMLElement.prototype.hidePopover ??= () => {};
const settle = async () => {
  await new Promise((done) => setTimeout(done, 0));
  flushSync();
};

afterEach(() => {
  mounted.splice(0).forEach((component) => unmount(component));
  document.body.innerHTML = '';
});

const member = (name: string, episodes = 0): CastMember => ({
  name,
  slug: name.toLowerCase().replace(/ /g, '-'),
  id: 7,
  characters: 'Nurse',
  episodes,
});

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

const names = () => [...document.querySelectorAll('.cast-card .name')].map((name) => name.textContent);
const pick = (label: string) => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
    b.textContent?.trim().startsWith(label),
  );
  button?.click();
  flushSync();
};

describe('component: ActorsStrip', () => {
  it('should load a counted group when picked, with shimmers meanwhile, and keep it', async () => {
    const read = deferred<readonly CastMember[] | null>();
    let reads = 0;
    const load = () => {
      reads++;
      return read.promise;
    };
    mounted.push(
      mount(ActorsStrip, {
        target: document.body,
        props: {
          groups: [
            { id: 'season-regulars', label: 'Series Regulars', cast: [member('Ellen Pompeo', 400)] },
            { id: 'guest-stars', label: 'Guest Stars', count: 2, load },
          ],
          creditsHref: '/shows/greys-anatomy/people',
        },
      }),
    );
    expect(names()).toEqual(['Ellen Pompeo']);
    expect(document.querySelector('a.cast-card')?.getAttribute('href')).toBe('/people/ellen-pompeo');
    expect(document.body.textContent).toContain('400 episodes');
    expect(reads).toBe(0);

    pick('Guest Stars');
    expect(reads).toBe(1);
    expect(document.querySelector('.cast[aria-busy="true"]')).not.toBeNull();

    read.resolve([member('Aniela Gumbs', 62), member('Payton Silver')]);
    await settle();
    expect(names()).toEqual(['Aniela Gumbs', 'Payton Silver']);

    pick('Series Regulars');
    pick('Guest Stars');
    await settle();
    expect(names()).toEqual(['Aniela Gumbs', 'Payton Silver']);
    expect(reads).toBe(1);
  });

  it('should offer Try again when a counted group fails, and read it again', async () => {
    let reads = 0;
    const load = async () => (++reads === 1 ? null : [member('Aniela Gumbs')]);
    mounted.push(
      mount(ActorsStrip, {
        target: document.body,
        props: {
          groups: [{ id: 'guest-stars', label: 'Guest Stars', count: 1, load }],
          creditsHref: '/shows/greys-anatomy/people',
        },
      }),
    );
    await settle();
    expect(document.body.textContent).toContain("Guest Stars didn't load");

    pick('Try again');
    await settle();
    expect(names()).toEqual(['Aniela Gumbs']);
    expect(reads).toBe(2);
  });
});
