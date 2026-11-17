import { describe, expect, it } from 'vitest';
import { reportPlaceholder } from './reportPlaceholder.ts';

describe('reportPlaceholder', () => {
  it('should ask for every copy on a duplicate comment', () => {
    expect(reportPlaceholder('duplicate')).toBe('Paste Trakt links to the original and each duplicate');
  });

  it('should ask which part is the spoiler', () => {
    expect(reportPlaceholder('spoilers')).toBe('Which part is the spoiler?');
  });

  it('should fall back to asking for details', () => {
    expect(reportPlaceholder('')).toBe('Add details for the Trakt team');
    expect(reportPlaceholder('spam')).toBe('Add details for the Trakt team');
  });
});
