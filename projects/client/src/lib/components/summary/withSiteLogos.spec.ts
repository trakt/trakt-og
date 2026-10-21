import { describe, expect, it } from 'vitest';
import { withSiteLogos } from './withSiteLogos.ts';

describe('withSiteLogos', () => {
  const links = [
    { label: 'Official Site', href: 'https://example.com' },
    { label: 'IMDB', href: 'https://www.imdb.com/title/tt10986410' },
    { label: 'TVDB', href: 'https://www.thetvdb.com/dereferrer/series/383203' },
    { label: 'Fanart.tv', href: 'https://fanart.tv/series/383203' },
    { label: 'Elsewhere', href: 'https://example.org' },
    {
      label: 'Wikipedia',
      href: 'https://en.wikipedia.org/wiki/Ted_Lasso',
      icon: '<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>',
    },
  ];

  it('should give every known site its logo', () => {
    const labels = ['Official Site', 'IMDB', 'TVDB', 'Fanart.tv'];
    const icons = withSiteLogos(links).filter((link) => labels.includes(link.label)).map((link) => link.icon);
    expect(icons).toHaveLength(4);
    icons.forEach((icon) => expect(icon).toContain('<svg'));
  });

  it('should give a branded site its color and leave a plain one without', () => {
    const colors = Object.fromEntries(withSiteLogos(links).map((link) => [link.label, link.color]));
    expect(colors['IMDB']).toBe('var(--color-site-imdb)');
    expect(colors['Official Site']).toBeUndefined();
  });

  it('should keep an icon a link already has', () => {
    expect(withSiteLogos(links).find((link) => link.label === 'Wikipedia')?.icon).toBe(links[5]?.icon);
  });

  it('should put a link without a logo after every icon link, keeping their order', () => {
    expect(withSiteLogos(links).map((link) => link.label)).toEqual([
      'Official Site',
      'IMDB',
      'TVDB',
      'Fanart.tv',
      'Wikipedia',
      'Elsewhere',
    ]);
  });

  it('should leave a site without a logo as text', () => {
    expect(withSiteLogos(links).find((link) => link.label === 'Elsewhere')?.icon).toBeUndefined();
  });
});
