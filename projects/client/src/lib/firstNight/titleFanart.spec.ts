import { describe, expect, it } from 'vitest';
import { titleFanart } from './titleFanart.ts';

describe('titleFanart', () => {
  it('should build the fanart from its Trakt id', async () => {
    expect(await titleFanart('shows', 'mr-robot')).toBe('https://media.trakt.tv/shows/93720/full/fanart.webp');
  });

  it('should have no art for a title it has no id for', async () => {
    expect(await titleFanart('movies', 'unknown')).toBeUndefined();
  });
});
