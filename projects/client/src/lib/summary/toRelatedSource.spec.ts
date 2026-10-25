import { describe, expect, it } from 'vitest';
import { toRelatedSource } from './toRelatedSource.ts';

describe('toRelatedSource', () => {
  it("should keep the title's first genre for the popular fallback", () => {
    const source = toRelatedSource({ subgenres: ['heist'], genres: ['crime', 'drama'], people: null });
    expect(source).toEqual({ subgenres: ['heist'], people: [], genre: 'crime' });
  });

  it('should have no genre when the title has none', () => {
    expect(toRelatedSource({ subgenres: null, genres: null, people: null }).genre).toBeUndefined();
  });
});
