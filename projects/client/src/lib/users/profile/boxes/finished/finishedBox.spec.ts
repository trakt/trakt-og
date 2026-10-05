import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { finishedBox } from './finishedBox.ts';

const { maya, dex, sam } = boxPersonas;

describe('finishedBox', () => {
  it('should show shows finished, the share of started ones and the latest finish', async () => {
    expect(await finishedBox.evaluate(maya.input, maya.extras())).toMatchObject({
      score: 55,
      entry: {
        view: {
          count: '64',
          finished: 64,
          started: 90,
          share: '71% of shows started',
          month: '+1 this month',
          latest: { title: { text: 'Slow Horses', href: '/shows/slow-horses' }, when: '6 days ago' },
        },
      },
    });
  });

  it('should say nothing was finished lately when none of the recent shows is complete', async () => {
    expect(await finishedBox.evaluate(dex.input, dex.extras())).toMatchObject({
      score: 11,
      entry: { view: { latest: null, month: null } },
    });
  });

  it('should need five finished shows', async () => {
    expect(await finishedBox.evaluate(sam.input, sam.extras())).toMatchObject({ score: null, entry: null });
  });
});
