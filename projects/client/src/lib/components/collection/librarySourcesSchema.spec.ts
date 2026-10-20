import { describe, expect, it } from 'vitest';
import { librarySourcesSchema } from './librarySourcesSchema.ts';

describe('schema: librarySourcesSchema', () => {
  it('should keep known media servers in a fixed order', () => {
    expect(librarySourcesSchema.parse([{ name: 'jellyfin' }, { name: 'plex' }])).toEqual(['plex', 'jellyfin']);
  });

  it('should drop media servers it has no icon for', () => {
    expect(librarySourcesSchema.parse([{ name: 'emby' }])).toEqual([]);
  });

  it('should read a missing or null field as no sources', () => {
    expect(librarySourcesSchema.parse(undefined)).toEqual([]);
    expect(librarySourcesSchema.parse(null)).toEqual([]);
  });
});
