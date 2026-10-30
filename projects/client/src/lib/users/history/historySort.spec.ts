import { describe, expect, it } from 'vitest';
import { historyPath, historySort } from './historySort.ts';

describe('historySort', () => {
  it('should read the sort segments, falling back to Watched Date for a sort the type lacks', () => {
    expect(historySort('movies', 'plays/asc')).toEqual({ by: 'plays', how: 'asc' });
    expect(historySort('shows', 'title/desc')).toEqual({ by: 'title', how: 'desc' });
    expect(historySort('shows', 'popularity/asc')).toEqual({ by: 'added', how: 'asc' });
    expect(historySort('episodes', 'plays/asc')).toEqual({ by: 'added', how: 'asc' });
    expect(historySort('all', undefined)).toEqual({ by: 'added', how: 'asc' });
  });

  it('should keep Watched Date newest first', () => {
    expect(historySort('shows', 'added/desc')).toEqual({ by: 'added', how: 'asc' });
  });
});

describe('historyPath', () => {
  it('should leave All Types and the default sort out of the path', () => {
    expect(historyPath('all', { by: 'added', how: 'asc' })).toBe('');
    expect(historyPath('shows', { by: 'added', how: 'asc' })).toBe('/shows');
    expect(historyPath('movies', { by: 'time', how: 'desc' })).toBe('/movies/time/desc');
  });
});
