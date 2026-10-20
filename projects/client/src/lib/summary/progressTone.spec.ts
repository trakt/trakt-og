import { describe, expect, it } from 'vitest';
import { progressTone } from './progressTone.ts';

describe('progressTone', () => {
  it('should read as started under half', () => {
    expect([0, 12, 49].map(progressTone)).toEqual(['started', 'started', 'started']);
  });

  it('should read as half from 50% up to 99%', () => {
    expect([50, 89, 99].map(progressTone)).toEqual(['half', 'half', 'half']);
  });

  it('should read as complete from 100%, rewatches included', () => {
    expect([100, 240].map(progressTone)).toEqual(['complete', 'complete']);
  });
});
