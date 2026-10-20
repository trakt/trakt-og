import { describe, expect, it } from 'vitest';
import { mediaTags } from './mediaTags.ts';

describe('mediaTags', () => {
  it('should lead with the type in a mix, then the year, certificate, runtime and two genres', () => {
    expect(
      mediaTags({
        type: 'movie',
        mixed: true,
        year: 2026,
        certification: 'R',
        runtime: 96,
        genres: ['Horror', 'Comedy', 'Fantasy'],
      }),
    ).toEqual([
      { text: 'Movie', kind: 'primary' },
      { text: '2026' },
      { text: 'R', kind: 'badge' },
      { segments: ['1h 36m'] },
      { segments: ['Horror', 'Comedy'] },
    ]);
  });

  it('should join a show runtime and episodes and end with the network', () => {
    expect(mediaTags({ type: 'show', runtime: 50, airedEpisodes: 24, network: 'HBO' })).toEqual([
      { segments: ['50m', '24 episodes'] },
      { text: 'HBO' },
    ]);
  });
});
