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
    // No About Me to pin; two number boxes (the binge and watch time), a picture, and the latest finish.
    ['maya', ['last-watched', 'biggest-binge', 'watch-time', 'finished']],
    // About Me pinned; ratings and the October horror spike take the two number slots, Alien the picture.
    ['dex', ['about', 'on-repeat', 'genre-pulse', 'ratings']],
    // About Me pinned; her lists and ratings, and the watchlist edges out a play three days old.
    ['lena', ['about', 'ratings', 'top-list', 'featured-list']],
    // Only Last Watched clears the bar; the floor fills the rest with the classic four.
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

    const row = (...values: (number | null)[]) =>
      Object.fromEntries(profileBoxes.map(({ key }, i) => [key, values[i]]));

    // About Me, Last Watched, On Repeat, Biggest Binge, Watch Time, Genre Pulse, Ratings, Finished, Top List, Featured.
    expect(await scores('maya')).toEqual(row(null, 80, 35, 75, 97, null, 12, 55, null, 40));
    expect(await scores('dex')).toEqual(row(100, 64, 90, null, 55, 73, 93, 11, 21, 50));
    expect(await scores('lena')).toEqual(row(100, 44, null, null, 39, null, 82, 18, 99, 50));
    expect(await scores('sam')).toEqual(row(null, 53, null, null, 21, null, null, null, null, 22));
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

    // It outscores Maya's latest finish and joins the strip at the end of the registry.
    expect(picked.map(({ key }) => key)).toEqual(['last-watched', 'biggest-binge', 'watch-time', 'new']);
    expect(picked.at(-1)).toEqual({
      key: 'new',
      view: { name: 'New', href: '/new', count: null, posters: [], next: null },
    });
  });
});
