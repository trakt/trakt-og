import { describe, expect, it } from 'vitest';
import { reportPlaceholder } from './reportPlaceholder.ts';

describe('reportPlaceholder', () => {
  it('should ask for the correct item on a duplicate item', () => {
    expect(reportPlaceholder('movie', 'duplicate')).toBe('Paste the Trakt link to the correct item');
  });

  it('should ask for every copy on a duplicate comment', () => {
    expect(reportPlaceholder('comment', 'duplicate')).toBe('Paste Trakt links to the original and each duplicate');
  });

  it('should ask what the reason needs', () => {
    expect(reportPlaceholder('show', 'metadata')).toBe("What's wrong, and when did you fix it on TMDB?");
    expect(reportPlaceholder('episode', 'runtime')).toBe('The correct runtime, and where it comes from');
    expect(reportPlaceholder('comment', 'spoilers')).toBe('Which part is the spoiler?');
  });

  it('should fall back to asking for details', () => {
    expect(reportPlaceholder('user', '')).toBe('Add details for the Trakt team');
    expect(reportPlaceholder('list', 'spam')).toBe('Add details for the Trakt team');
  });
});
