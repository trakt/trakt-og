import { describe, expect, it } from 'vitest';
import type { SeoMeta } from './SeoMeta.ts';
import { toSeoTags as toTags } from './toSeoTags.ts';

const movie = { url: new URL('https://og.example/movies/inception-2010?sort=x'), routeId: '/movies/[id]', status: 200 };
const toSeoTags = (meta: SeoMeta) => toTags(meta, movie);

describe('seo: toSeoTags', () => {
  it('should template the title and keep the plain one for previews', () => {
    const tags = toSeoTags({ title: 'Inception (2010)' });

    expect(tags.title).toBe('Inception (2010) - Trakt OG Redux');
    expect(tags.og.title).toBe('Inception (2010)');
  });

  it('should fall back to the site name and default description', () => {
    const tags = toSeoTags({});

    expect(tags.title).toBe('Trakt OG Redux');
    expect(tags.og).toEqual({
      title: 'Trakt OG Redux',
      description: tags.description,
      type: 'website',
      url: 'https://og.trakt.tv/movies/inception-2010',
    });
    expect(tags.description).toMatch(/^Trakt OG Redux: classic Trakt/);
  });

  it('should clean the description and fall back when nothing is left', () => {
    expect(toSeoTags({ description: ' A  [link](https://x.y) ' }).description).toBe('A link');
    expect(toSeoTags({ description: 'https://only.a/link' }).description).toMatch(/^Trakt OG Redux/);
  });

  it('should rewrite .webp art and describe it with the title by default', () => {
    const tags = toSeoTags({ title: 'Inception (2010)', image: 'https://media.trakt.tv/a/full/x.jpg.webp' });

    expect(tags.image).toEqual({ url: 'https://media.trakt.tv/a/full/x.jpg', alt: 'Inception (2010)' });
    expect(toSeoTags({ image: 'https://a/x.jpg', imageAlt: 'Poster' }).image?.alt).toBe('Poster');
  });

  it('should take the robots value from the route, the status and the page', () => {
    expect(toSeoTags({}).robots).toBe('index, follow, max-image-preview:large');
    expect(toSeoTags({ noindex: true }).robots).toBe('noindex, follow');
    expect(toTags({}, { ...movie, status: 404 }).robots).toBe('noindex, follow');
    expect(toTags({}, { ...movie, routeId: '/dashboard' }).robots).toBe('noindex, follow');
  });

  it('should link the canonical URL, and leave it out on an error page', () => {
    expect(toSeoTags({}).canonical).toBe('https://og.trakt.tv/movies/inception-2010');
    expect(toSeoTags({ canonicalPath: '/' }).og.url).toBe('https://og.trakt.tv/');
    expect(toTags({}, { ...movie, status: 404 }).canonical).toBeNull();
  });
});
