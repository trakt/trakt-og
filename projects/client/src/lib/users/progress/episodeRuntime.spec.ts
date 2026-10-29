import { describe, expect, it } from 'vitest';
import { episodeRuntime } from './episodeRuntime.ts';

describe('episodeRuntime', () => {
  it("should take the show's runtime", () => {
    expect(episodeRuntime({ runtime: 45, totalRuntime: 900, airedEpisodes: 10 })).toBe(45);
  });

  it('should spread the total runtime over the aired episodes for a show without one', () => {
    expect(episodeRuntime({ runtime: 0, totalRuntime: 51, airedEpisodes: 6 })).toBe(8.5);
    expect(episodeRuntime({ totalRuntime: 51, airedEpisodes: 6 })).toBe(8.5);
  });

  it('should be 0 with nothing to go on', () => {
    expect(episodeRuntime({ runtime: 0, airedEpisodes: 6 })).toBe(0);
    expect(episodeRuntime({ totalRuntime: 51, airedEpisodes: 0 })).toBe(0);
  });
});
