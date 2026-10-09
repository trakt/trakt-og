import { describe, expect, it } from 'vitest';
import { episodeBatchState } from './episodeBatchState.ts';

describe('episodeBatchState', () => {
  it('should count the watched and collected episodes of the batch', () => {
    expect(episodeBatchState([{ watched: true, collected: true }, { watched: false }, { watched: true }])).toEqual({
      watchedEpisodes: 2,
      watched: true,
      collectedEpisodes: 1,
      collected: true,
    });
  });

  it('should be unwatched for none', () => {
    expect(episodeBatchState([{}, {}])).toMatchObject({ watched: false, collected: false });
  });
});
