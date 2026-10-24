import { describe, expect, it } from 'vitest';
import { designCatalog } from './designCatalog.ts';
import { findDesignDemo } from './findDesignDemo.ts';

const routes = Object.keys(import.meta.glob('/src/routes/_design/*/+page.svelte'))
  .map((path) => path.split('/').at(-2))
  .sort();
const slugs = designCatalog.flatMap(({ demos }) => demos.map(({ slug }) => slug));

describe('designCatalog', () => {
  it('should list every demo route', () => {
    expect([...slugs].sort()).toEqual(routes);
  });

  it('should list each demo once', () => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('findDesignDemo', () => {
  it('should find a demo with its group', () => {
    expect(findDesignDemo('/_design/comments')).toMatchObject({ slug: 'comments', group: 'Community' });
  });

  it('should find a demo from a deeper path', () => {
    expect(findDesignDemo('/_design/search/extra')?.slug).toBe('search');
  });

  it('should find nothing for the index', () => {
    expect(findDesignDemo('/_design')).toBeUndefined();
    expect(findDesignDemo('/_design/')).toBeUndefined();
  });
});
