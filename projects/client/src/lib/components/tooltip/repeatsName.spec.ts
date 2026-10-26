import { describe, expect, it } from 'vitest';
import { repeatsName } from './repeatsName.ts';

describe('repeatsName', () => {
  it('should match a tooltip that repeats the name', () => {
    expect(repeatsName('Edit note', 'Edit note')).toBe(true);
  });

  it('should ignore case, spacing and punctuation', () => {
    expect(repeatsName('Filter by title', 'Filter by Title')).toBe(true);
    expect(repeatsName('Remove the GIF', '  Remove the GIF. ')).toBe(true);
  });

  it('should keep a tooltip that adds something', () => {
    expect(repeatsName('Close', 'Close (Esc)')).toBe(false);
    expect(repeatsName('Add to watched history', '3 plays 6h 30m')).toBe(false);
  });

  it('should keep a tooltip when the trigger has no name', () => {
    expect(repeatsName('', 'Click to reveal spoilers')).toBe(false);
    expect(repeatsName('', '')).toBe(false);
  });
});
