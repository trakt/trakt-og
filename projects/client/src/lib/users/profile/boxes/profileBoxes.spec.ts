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
  return (await toProfileBoxes(input, extras())).shown.map(({ key }) => key);
};

describe('profileBoxes', () => {
  it.each<[PersonaId, string[]]>([
    // No About Me; Watch Time third, the binge the other number box, then a picture and the latest finish.
    ['maya', ['last-watched', 'biggest-binge', 'watch-time', 'finished']],
    // About Me first and Watch Time third; Alien and the October horror spike take the other two.
    ['dex', ['about', 'on-repeat', 'watch-time', 'genre-pulse']],
    // About Me first and Watch Time third, with her two lists.
    ['lena', ['about', 'top-list', 'watch-time', 'featured-list']],
    // Only Last Watched clears the bar, and the floor has just the watchlist left to fill with.
    ['sam', ['last-watched', 'featured-list', 'watch-time']],
  ])('should give %s the strip %j', async (id, keys) => {
    expect(await strip(id)).toEqual(keys);
  });

  it('should keep the next best boxes for the More row', async () => {
    const { input, extras } = boxPersonas.dex;
    const { more } = await toProfileBoxes(input, extras());
    expect(more.map(({ key }) => key)).toEqual(['last-watched', 'ratings', 'top-list', 'featured-list']);
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

    // About Me, Watch Time, Last Watched, On Repeat, Biggest Binge, Genre Pulse, Ratings, Finished, Top List, Featured.
    expect(await scores('maya')).toEqual(row(null, 97, 80, 35, 75, null, 12, 55, null, 40));
    expect(await scores('dex')).toEqual(row(100, 55, 64, 90, null, 73, 93, 11, 21, 50));
    expect(await scores('lena')).toEqual(row(100, 39, 44, null, null, null, 82, 18, 99, 50));
    expect(await scores('sam')).toEqual(row(null, 21, 53, null, null, null, null, null, null, 22));
  });

  it('should take a new box from its module alone', async () => {
    const newBox = defineProfileBox({
      key: 'new',
      group: 'colour',
      component: FeaturedListBox,
      score: ({ stats }) => (stats.episodes.plays > 1_000 ? 95 : null),
      view: () => ({ name: 'New', href: '/new', items: 0, posters: [], next: [] }),
    });
    const { input, extras } = boxPersonas.maya;
    const loader = extras();

    const picked = pickProfileBoxes(
      await Promise.all([...profileBoxes, newBox].map((box) => box.evaluate(input, loader))),
    ).shown;

    // It outscores Maya's latest finish and joins the strip at the end of the registry.
    expect(picked.map(({ key }) => key)).toEqual(['last-watched', 'biggest-binge', 'watch-time', 'new']);
    expect(picked.at(-1)).toEqual({
      key: 'new',
      view: { name: 'New', href: '/new', items: 0, posters: [], next: [] },
    });
  });
});
