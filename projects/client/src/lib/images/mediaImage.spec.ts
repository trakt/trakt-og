import { describe, expect, it } from 'vitest';
import { mediaImage } from './mediaImage.ts';

describe('util: mediaImage', () => {
  it('should build an image URL from the Trakt id', () => {
    expect(mediaImage({ type: 'movie', id: 1390, slot: 'poster', size: 'medium' })).toBe(
      'https://media.trakt.tv/movies/1390/medium/poster.webp',
    );
    expect(mediaImage({ type: 'episode', id: 14554539, slot: 'screenshot', size: 'thumb' })).toBe(
      'https://media.trakt.tv/episodes/14554539/thumb/screenshot.webp',
    );
  });

  it('should use the plural folder for every type', () => {
    const folder = (type: Parameters<typeof mediaImage>[0]['type']) =>
      mediaImage({ type, id: 1, slot: 'fanart', size: 'full' }).split('/').at(3);

    expect(folder('person')).toBe('people');
    expect(folder('company')).toBe('companies');
    expect(folder('season')).toBe('seasons');
    expect(folder('list')).toBe('lists');
  });

  it('should use the medium size for a thumb logo, clearart or banner', () => {
    expect(mediaImage({ type: 'show', id: 1, slot: 'logo', size: 'thumb' })).toBe(
      'https://media.trakt.tv/shows/1/medium/logo.webp',
    );
    expect(mediaImage({ type: 'show', id: 1, slot: 'banner', size: 'thumb' })).toBe(
      'https://media.trakt.tv/shows/1/medium/banner.webp',
    );
    expect(mediaImage({ type: 'show', id: 1, slot: 'thumb', size: 'thumb' })).toBe(
      'https://media.trakt.tv/shows/1/thumb/thumb.webp',
    );
  });

  it('should carry the fallback art in the fragment', () => {
    const show = mediaImage({ type: 'show', id: 2, slot: 'poster', size: 'thumb' });

    expect(mediaImage({ type: 'season', id: 9, slot: 'poster', size: 'thumb', fallback: show })).toBe(
      'https://media.trakt.tv/seasons/9/thumb/poster.webp#fallback=https%3A%2F%2Fmedia.trakt.tv%2Fshows%2F2%2Fthumb%2Fposter.webp',
    );
  });
});
