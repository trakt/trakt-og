import { describe, expect, it } from 'vitest';
import { imageUrl, webpImageUrl } from './imageUrl.ts';

const POSTER = 'media.trakt.tv/images/shows/000/139/960/posters/medium/c5b8a81eba.jpg.webp';

describe('imageUrl', () => {
  it('should swap the size segment and add https', () => {
    expect(imageUrl(POSTER, 'thumb')).toBe(
      'https://media.trakt.tv/images/shows/000/139/960/posters/thumb/c5b8a81eba.jpg.webp',
    );
    expect(imageUrl(POSTER, 'full')).toBe(
      'https://media.trakt.tv/images/shows/000/139/960/posters/full/c5b8a81eba.jpg.webp',
    );
  });

  it('should keep the medium path as is', () => {
    expect(imageUrl(POSTER, 'medium')).toBe(`https://${POSTER}`);
  });

  it('should upgrade http and keep https', () => {
    expect(imageUrl(`http://${POSTER}`, 'medium')).toBe(`https://${POSTER}`);
    expect(imageUrl(`https://${POSTER}`, 'full')).toBe(imageUrl(POSTER, 'full'));
  });

  it('should only swap the segment right before the file name', () => {
    expect(imageUrl('media.trakt.tv/images/thumb/posters/medium/a.jpg', 'full')).toBe(
      'https://media.trakt.tv/images/thumb/posters/full/a.jpg',
    );
  });

  it('should be undefined without a path', () => {
    expect(imageUrl(undefined, 'thumb')).toBeUndefined();
    expect(imageUrl(null, 'thumb')).toBeUndefined();
    expect(imageUrl('  ', 'thumb')).toBeUndefined();
  });
});

describe('webpImageUrl', () => {
  const FANART = 'https://media.trakt.tv/images/movies/000/004/633/fanarts/full/92b393e11d.jpg';

  it('should add .webp to a media image', () => {
    expect(webpImageUrl(FANART)).toBe(`${FANART}.webp`);
  });

  it('should keep a URL that is already webp', () => {
    expect(webpImageUrl(`${FANART}.webp`)).toBe(`${FANART}.webp`);
  });

  it('should keep an avatar, which has no webp copy', () => {
    const avatar = 'https://media.trakt.tv/images/admins/000/000/001/avatars/large/2e6df69058.jpg';
    expect(webpImageUrl(avatar)).toBe(avatar);
  });

  it('should keep URLs from other hosts', () => {
    expect(webpImageUrl('https://example.com/images/a.jpg')).toBe('https://example.com/images/a.jpg');
  });
});
