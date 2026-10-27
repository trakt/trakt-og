import { describe, expect, it } from 'vitest';
import { ratingsPath } from './ratingsPath.ts';

describe('ratingsPath', () => {
  it('should leave every default out', () => {
    expect(ratingsPath({ type: 'all', rating: 'all', by: 'added', how: 'asc' })).toBe('');
    expect(ratingsPath({ type: 'movies', rating: 'all', by: 'added', how: 'asc' })).toBe('/movies');
  });

  it('should keep the type ahead of a rating', () => {
    expect(ratingsPath({ type: 'all', rating: '10', by: 'added', how: 'asc' })).toBe('/all/10');
  });

  it('should spell out every segment for a sort', () => {
    expect(ratingsPath({ type: 'shows', rating: 'all', by: 'added', how: 'desc' })).toBe('/shows/all/added/desc');
  });
});
