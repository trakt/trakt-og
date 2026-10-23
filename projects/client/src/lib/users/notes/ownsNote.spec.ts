import { describe, expect, it } from 'vitest';
import { ownsNote } from './ownsNote.ts';

describe('util: ownsNote', () => {
  it('should match the viewer to the author by user id', () => {
    expect(ownsNote(7, { id: 7 })).toBe(true);
    expect(ownsNote(8, { id: 7 })).toBe(false);
  });

  it('should never match a signed-out viewer, a viewer without an id or a deleted author', () => {
    expect(ownsNote(null, { id: 7 })).toBe(false);
    expect(ownsNote(undefined, { id: null })).toBe(false);
    expect(ownsNote(7, { id: null })).toBe(false);
  });
});
