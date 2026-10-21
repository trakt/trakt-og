import { describe, expect, it } from 'vitest';
import { pickSurprise } from './pickSurprise.ts';

describe('pickSurprise', () => {
  it('should pick the crasher or the balloons by the random draw', () => {
    const picks = [0, 0.49, 0.5, 0.99].map((n) => pickSurprise({ random: () => n, reducedMotion: false, knownFor: 5 }));
    expect(picks).toEqual(['crasher', 'crasher', 'balloons', 'balloons']);
  });

  it('should play nothing with reduced motion', () => {
    expect(pickSurprise({ random: () => 0, reducedMotion: true, knownFor: 5 })).toBeUndefined();
  });

  it('should play nothing without Known For posters', () => {
    expect(pickSurprise({ random: () => 0, reducedMotion: false, knownFor: 0 })).toBeUndefined();
  });
});
