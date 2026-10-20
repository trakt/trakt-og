import { describe, expect, it } from 'vitest';
import { librarySourceIcon } from './librarySourceIcon.ts';

describe('util: librarySourceIcon', () => {
  it('should be undefined for items added by hand', () => {
    expect(librarySourceIcon(undefined)).toBeUndefined();
    expect(librarySourceIcon([])).toBeUndefined();
  });

  it("should use the first source's icon and name every source", () => {
    const plex = librarySourceIcon(['plex']);
    const both = librarySourceIcon(['plex', 'jellyfin']);

    expect(plex?.name).toBe('Plex');
    expect(both?.name).toBe('Plex and Jellyfin');
    expect(both?.svg).toBe(plex?.svg);
  });
});
