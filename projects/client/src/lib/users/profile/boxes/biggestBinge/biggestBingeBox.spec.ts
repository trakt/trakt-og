import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { biggestBingeBox } from './biggestBingeBox.ts';

const { maya, lena } = boxPersonas;

describe('biggestBingeBox', () => {
  it('should find the most episodes of one show on one UTC day', async () => {
    expect(await biggestBingeBox.evaluate(maya.input, maya.extras())).toMatchObject({
      score: 75,
      entry: {
        key: 'biggest-binge',
        view: { episodes: 11, show: { text: 'Severance', href: '/shows/severance' }, day: 'Sat, Sep 26' },
      },
    });
  });

  it('should take the more recent day on a tie', async () => {
    const play = (day: string) => ({ ...maya.input.recent.episodes[0], watched_at: `${day}T10:00:00.000Z` });
    const input = {
      ...maya.input,
      recent: { episodes: [...Array(4).fill(play('2026-09-20')), ...Array(4).fill(play('2026-09-22'))], movies: [] },
    };
    expect((await biggestBingeBox.evaluate(input, maya.extras())).entry?.view.day).toBe('Tue, Sep 22');
  });

  it('should need four episodes', async () => {
    expect(await biggestBingeBox.evaluate(lena.input, lena.extras())).toMatchObject({ score: null, entry: null });
  });
});
