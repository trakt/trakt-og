import { describe, expect, it } from 'vitest';
import { ticksGuessed } from './ticksGuessed.ts';

describe('util: ticksGuessed', () => {
  it('should be guessed for a part-watched show without its catalog', () => {
    expect(ticksGuessed({ completed: 4, left: 6 })).toBe(true);
  });

  it('should be exact once the catalog is in', () => {
    expect(ticksGuessed({ completed: 4, left: 6, seasons: [] })).toBe(false);
  });

  it('should be exact when nothing is watched yet', () => {
    expect(ticksGuessed({ completed: 0, left: 10 })).toBe(false);
  });

  it('should be exact when every aired episode is watched', () => {
    expect(ticksGuessed({ completed: 10, left: 0 })).toBe(false);
  });
});
