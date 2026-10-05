import { describe, expect, it } from 'vitest';
import { boxPersonas } from './boxPersonas.ts';
import { defineProfileBox } from './defineProfileBox.ts';
import FeaturedListBox from './featuredList/FeaturedListBox.svelte';
import { pickProfileBoxes } from './pickProfileBoxes.ts';
import { profileBoxes } from './profileBoxes.ts';
import { toProfileBoxes } from './toProfileBoxes.ts';

type PersonaId = keyof typeof boxPersonas;

const strip = async (id: PersonaId) => {
  const { input, extras } = boxPersonas[id];
  return (await toProfileBoxes(input, extras())).map(({ key }) => key);
};

describe('profileBoxes', () => {
  it.each<[PersonaId, string[]]>([
    ['maya', ['about', 'last-watched', 'watch-time', 'featured-list']],
    ['dex', ['about', 'last-watched', 'watch-time', 'featured-list']],
    ['lena', ['about', 'last-watched', 'watch-time', 'featured-list']],
    ['sam', ['about', 'last-watched', 'watch-time', 'featured-list']],
  ])('should give %s the strip %j', async (id, keys) => {
    expect(await strip(id)).toEqual(keys);
  });

  it('should score each persona the same way every time', async () => {
    const scores = async (id: PersonaId) => {
      const { input, extras } = boxPersonas[id];
      const loader = extras();
      const evaluated = await Promise.all(profileBoxes.map((box) => box.evaluate(input, loader)));
      return Object.fromEntries(evaluated.map(({ key, score }) => [key, score]));
    };

    expect(await scores('maya')).toEqual({ about: null, 'last-watched': 80, 'watch-time': 97, 'featured-list': 40 });
    expect(await scores('dex')).toMatchObject({ about: 100, 'last-watched': 64 });
    expect(await scores('lena')).toMatchObject({ about: 100, 'last-watched': 44, 'featured-list': 50 });
    expect(await scores('sam')).toMatchObject({ about: null, 'last-watched': 53, 'featured-list': 22 });
  });

  it('should take a new box from its module alone', async () => {
    const newBox = defineProfileBox({
      key: 'new',
      group: 'colour',
      component: FeaturedListBox,
      score: ({ stats }) => stats.episodes.plays > 1_000 ? 95 : null,
      view: () => ({ name: 'New', href: '/new', count: null, posters: [], next: null }),
    });
    const { input, extras } = boxPersonas.maya;
    const loader = extras();

    const picked = pickProfileBoxes(
      await Promise.all([...profileBoxes, newBox].map((box) => box.evaluate(input, loader))),
    );

    // Maya's empty About Me was only a filler, so the new box takes its slot, in registry order.
    expect(picked.map(({ key }) => key)).toEqual(['last-watched', 'watch-time', 'featured-list', 'new']);
    expect(picked.at(-1)).toEqual({
      key: 'new',
      view: { name: 'New', href: '/new', count: null, posters: [], next: null },
    });
  });
});
