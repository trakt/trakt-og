import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { onRepeatBox } from './onRepeatBox.ts';

const { maya, dex, lena } = boxPersonas;

describe('onRepeatBox', () => {
  it('should show the movie seen most, with its fanart and how many others were rewatched', async () => {
    expect(await onRepeatBox.evaluate(dex.input, dex.extras())).toMatchObject({
      score: 90,
      entry: {
        view: {
          times: 9,
          image: 'https://media.trakt.tv/movies/295/thumb/fanart.webp',
          title: { text: 'Alien', href: '/movies/alien-1979' },
          line: 'Seen 9 times · last on Sep 23',
          others: '+22 more rewatched',
        },
      },
    });
  });

  it('should count full runs through a show from its plays and aired episodes', async () => {
    expect(await onRepeatBox.evaluate(maya.input, maya.extras())).toMatchObject({
      score: 35,
      entry: {
        view: {
          times: 3,
          title: { text: 'The Office' },
          line: '3 full runs · and counting',
          others: '+4 more rewatched',
        },
      },
    });
  });

  it('should build a show fanart from its id', async () => {
    const input = { ...maya.input, watched: { shows: maya.input.watched.shows.slice(0, 1), movies: [] } };
    expect((await onRepeatBox.evaluate(input, maya.extras())).entry?.view).toMatchObject({
      title: { text: 'Severance' },
      image: 'https://media.trakt.tv/shows/154997/thumb/fanart.webp',
      others: null,
    });
  });

  it('should need a movie seen three times or a show watched through twice', async () => {
    expect(await onRepeatBox.evaluate(lena.input, lena.extras())).toMatchObject({ score: null, entry: null });
  });
});
