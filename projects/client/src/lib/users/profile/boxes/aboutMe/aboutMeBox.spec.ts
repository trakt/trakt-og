import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { aboutMeBox } from './aboutMeBox.ts';

const { dex, maya } = boxPersonas;

describe('aboutMeBox', () => {
  it('should pin a written About Me with the VIP years, join month and location', async () => {
    expect(await aboutMeBox.evaluate(dex.input, dex.extras())).toMatchObject({
      score: 100,
      entry: {
        key: 'about',
        view: {
          kind: 'filled',
          about: expect.stringContaining('Letterboxd refugee'),
          vip: 'VIP · 9 yrs',
          joined: 'March 2014',
          location: 'Austin, TX',
        },
      },
    });
  });

  it("should not score an empty one, and list a few facts on someone else's profile", async () => {
    expect(await aboutMeBox.evaluate(maya.input, maya.extras())).toMatchObject({
      score: null,
      entry: {
        view: {
          kind: 'other',
          name: 'Maya',
          facts: [
            { text: 'Mostly watches', bold: 'Drama' },
            { text: 'Watched', bold: '3,482 episodes and movies' },
            { text: 'On Trakt since', bold: 'June 2019' },
          ],
        },
      },
    });
  });

  it('should prompt you to write yours on your own empty profile, in the settings on v3 web', async () => {
    const result = await aboutMeBox.evaluate({ ...maya.input, isSelf: true }, maya.extras());
    expect(result.entry?.view).toEqual({ kind: 'self', settingsHref: 'https://app.trakt.tv/settings' });
  });

  it('should drop the facts it has no data for', async () => {
    const input = {
      ...maya.input,
      genres: [],
      profile: { ...maya.input.profile, joinedAt: null },
      stats: { ...maya.input.stats, episodes: { ...maya.input.stats.episodes, watched: 0 } },
    };
    expect((await aboutMeBox.evaluate(input, maya.extras())).entry?.view).toMatchObject({
      facts: [{ text: 'Watched', bold: '72 movies' }],
    });
  });
});
