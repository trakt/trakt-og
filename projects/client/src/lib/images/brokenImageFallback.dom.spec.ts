import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { startBrokenImages } from './brokenImageFallback.ts';
import { mediaImage } from './mediaImage.ts';

const stops: (() => void)[] = [];

// happy-dom has no `document.images`.
beforeAll(() => {
  Object.defineProperty(document, 'images', { configurable: true, get: () => [...document.querySelectorAll('img')] });
});

afterEach(() => {
  stops.splice(0).forEach((stop) => stop());
  document.body.innerHTML = '';
});

function brokenImage(src: string) {
  stops.push(startBrokenImages(document));
  const image = document.createElement('img');
  image.src = src;
  document.body.append(image);
  return {
    image,
    fail: () => image.dispatchEvent(new Event('error')),
  };
}

describe('startBrokenImages', () => {
  it('should try the fallback art before the placeholder', () => {
    const show = mediaImage({ type: 'show', id: 2, slot: 'poster', size: 'thumb' });
    const { image, fail } = brokenImage(
      mediaImage({ type: 'season', id: 9, slot: 'poster', size: 'thumb', fallback: show }),
    );

    fail();
    expect(image.src).toBe(show);

    fail();
    expect(image.src).toContain('poster');
    expect(image.src).not.toContain('media.trakt.tv');
  });

  it('should show the placeholder for art without a fallback', () => {
    const { image, fail } = brokenImage(mediaImage({ type: 'movie', id: 1, slot: 'fanart', size: 'thumb' }));

    fail();
    expect(image.src).toContain('fanart');
    expect(image.src).not.toContain('media.trakt.tv');
  });

  it('should hide a missing logo', () => {
    const { image, fail } = brokenImage(mediaImage({ type: 'show', id: 1, slot: 'logo', size: 'medium' }));

    fail();
    expect(image.style.visibility).toBe('hidden');
  });
});
