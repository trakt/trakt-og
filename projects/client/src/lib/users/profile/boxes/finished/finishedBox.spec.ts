import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { finishedBox } from './finishedBox.ts';

const { maya, dex, sam } = boxPersonas;

describe('finishedBox', () => {
  it('should show shows finished of those watched, in progress and dropped, and the latest finish', async () => {
    expect(await finishedBox.evaluate(maya.input, maya.extras())).toMatchObject({
      score: 55,
      entry: {
        view: {
          finished: '64',
          inProgress: 90,
          dropped: 0,
          meter: { finished: (64 / 154) * 100, inProgress: (90 / 154) * 100 },
          latest: { title: { text: 'Slow Horses', href: '/shows/slow-horses' }, when: '6 days ago' },
        },
      },
    });
  });

  it('should say nothing was finished lately when none of the recent shows is complete', async () => {
    expect(await finishedBox.evaluate(dex.input, dex.extras())).toMatchObject({
      score: 11,
      entry: { view: { latest: null } },
    });
  });

  it('should need five finished shows', async () => {
    expect(await finishedBox.evaluate(sam.input, sam.extras())).toMatchObject({ score: null, entry: null });
  });
});
