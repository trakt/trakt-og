import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { lastWatchedBox } from './lastWatchedBox.ts';

const { maya, dex, lena, sam } = boxPersonas;

describe('lastWatchedBox', () => {
  it('should show an episode watched today with the show fanart and the progress through the show', async () => {
    expect(await lastWatchedBox.evaluate(maya.input, maya.extras())).toEqual({
      key: 'last-watched',
      group: 'image',
      floor: true,
      score: 80,
      entry: {
        key: 'last-watched',
        view: {
          play: {
            image: 'https://media.trakt.tv/images/shows/000/154/997/fanarts/thumb/9400ecb8e2.jpg.webp',
            title: { text: 'Severance', href: '/shows/severance' },
            subtitle: { text: '2x09 The After Hours', href: '/shows/severance/seasons/2/episodes/9' },
            when: 'Today',
            progress: { completed: 18, aired: 19 },
          },
        },
      },
    });
  });

  it('should show a movie with its year and no progress', async () => {
    const { entry, score } = await lastWatchedBox.evaluate(dex.input, dex.extras());
    expect(score).toBe(64);
    expect(entry?.view.play).toMatchObject({
      title: { text: 'The Thing' },
      subtitle: { text: '1982' },
      when: 'Yesterday',
    });
    expect(entry?.view.play?.progress).toBeUndefined();
  });

  it('should score on recency alone, under the bar after three days', async () => {
    expect((await lastWatchedBox.evaluate(lena.input, lena.extras())).score).toBe(44);
    expect((await lastWatchedBox.evaluate(sam.input, sam.extras())).entry?.view.play?.when).toBe('2 days ago');
  });

  it('should leave the bar off when the progress request fails or misses the show', async () => {
    const result = await lastWatchedBox.evaluate(lena.input, () => Promise.resolve(undefined));
    expect(result.entry?.view.play).toMatchObject({ title: { text: 'Shōgun' } });
    expect(result.entry?.view.play?.progress).toBeUndefined();
  });

  it('should show the empty state with nothing watched', async () => {
    expect(await lastWatchedBox.evaluate({ ...sam.input, latest: {} }, sam.extras())).toMatchObject({
      score: null,
      entry: { view: { play: null } },
    });
  });
});
