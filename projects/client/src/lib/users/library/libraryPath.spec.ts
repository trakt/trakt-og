import { describe, expect, it } from 'vitest';
import { libraryPath } from './libraryPath.ts';

describe('libraryPath', () => {
  it('should leave All Types and the default sort out', () => {
    expect(libraryPath('all', { by: 'added', how: 'asc' })).toBe('');
    expect(libraryPath('movies', { by: 'added', how: 'asc' })).toBe('/movies');
  });

  it('should spell out any other sort after the type', () => {
    expect(libraryPath('movies', { by: 'title', how: 'asc' })).toBe('/movies/title/asc');
    expect(libraryPath('all', { by: 'added', how: 'desc' })).toBe('/all/added/desc');
  });
});
