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
  preloads.clear();
  document.body.innerHTML = '';
});

const preloads = new Map<string, (loaded: boolean) => void>();
const preload = (url: string) => new Promise<boolean>((resolve) => preloads.set(url, resolve));
const settle = async (url: string, loaded: boolean) => {
  preloads.get(url)?.(loaded);
  await Promise.resolve();
};

function brokenImage(src: string) {
  stops.push(startBrokenImages(document, preload));
  const image = document.createElement('img');
  image.src = src;
  document.body.append(image);
  return {
    image,
    fail: () => image.dispatchEvent(new Event('error')),
  };
}

describe('startBrokenImages', () => {
  it('should hold the placeholder while the fallback art loads, so Safari never draws its broken icon', async () => {
    const show = mediaImage({ type: 'show', id: 2, slot: 'poster', size: 'thumb' });
    const { image, fail } = brokenImage(
      mediaImage({ type: 'season', id: 9, slot: 'poster', size: 'thumb', fallback: show }),
    );

    fail();
    expect(image.src).toContain('poster');
    expect(image.src).not.toContain('media.trakt.tv');

    await settle(show, true);
    expect(image.src).toBe(show);
  });

  it('should keep the placeholder when the fallback art is missing too', async () => {
    const headshot = mediaImage({ type: 'person', id: 1, slot: 'headshot', size: 'thumb' });
    const { image, fail } = brokenImage(
      mediaImage({ type: 'portrait', id: 'show-2-1', slot: 'portrait', size: 'thumb', fallback: headshot }),
    );
    image.dataset.placeholder = '/silhouette.png';

    fail();
    await settle(headshot, false);
    expect(image.src).toContain('/silhouette.png');
  });

  it('should leave an image the page has moved on from', async () => {
    const show = mediaImage({ type: 'show', id: 2, slot: 'poster', size: 'thumb' });
    const next = mediaImage({ type: 'movie', id: 3, slot: 'poster', size: 'thumb' });
    const { image, fail } = brokenImage(
      mediaImage({ type: 'season', id: 9, slot: 'poster', size: 'thumb', fallback: show }),
    );

    fail();
    image.src = next;
    await settle(show, true);
    expect(image.src).toBe(next);
  });

  it('should show the placeholder for art without a fallback', () => {
    const { image, fail } = brokenImage(mediaImage({ type: 'movie', id: 1, slot: 'fanart', size: 'thumb' }));

    fail();
    expect(image.src).toContain('fanart');
    expect(image.src).not.toContain('media.trakt.tv');
  });

  it("should try the fallback art of a cast image app.html's early handler caught", async () => {
    const headshot = mediaImage({ type: 'person', id: 1, slot: 'headshot', size: 'thumb' });
    const image = document.createElement('img');
    image.src = '/silhouette.png';
    image.dataset.placeholder = '/silhouette.png';
    image.dataset.broken = mediaImage({
      type: 'portrait',
      id: 'show-2-1',
      slot: 'portrait',
      size: 'thumb',
      fallback: headshot,
    });
    document.body.append(image);
    stops.push(startBrokenImages(document, preload));

    expect(document.documentElement.hasAttribute('data-broken-images')).toBe(true);
    expect(image.dataset.broken).toBeUndefined();
    await settle(headshot, true);
    expect(image.src).toBe(headshot);
  });

  it('should hide a missing logo', () => {
    const { image, fail } = brokenImage(mediaImage({ type: 'show', id: 1, slot: 'logo', size: 'medium' }));

    fail();
    expect(image.style.visibility).toBe('hidden');
  });
});
