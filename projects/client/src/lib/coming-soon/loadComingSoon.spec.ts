import { describe, expect, it } from 'vitest';
import { loadComingSoon } from './loadComingSoon.ts';

const jar = (initial?: string) => {
  const store = new Map<string, string>(initial ? [['og_teaser', initial]] : []);
  return {
    store,
    cookies: {
      get: (name: string) => store.get(name),
      set: (name: string, value: string) => void store.set(name, value),
    },
  };
};

describe('loadComingSoon', () => {
  it('should show a different design than last time and remember it', () => {
    const { store, cookies } = jar('vhs');

    const { teaser } = loadComingSoon({ cookies, url: new URL('https://og.test/'), roll: 0 });

    expect(teaser).not.toBe('vhs');
    expect(store.get('og_teaser')).toBe(teaser);
  });

  it('should pin a design from the query without touching the rotation', () => {
    const { store, cookies } = jar('vhs');

    const { teaser } = loadComingSoon({ cookies, url: new URL('https://og.test/?teaser=seance'), roll: 0 });

    expect(teaser).toBe('seance');
    expect(store.get('og_teaser')).toBe('vhs');
  });

  it('should ignore an unknown pinned design and rotate as usual', () => {
    const { cookies } = jar();

    expect(loadComingSoon({ cookies, url: new URL('https://og.test/?teaser=mummy'), roll: 0 }).teaser).toBe('lobby');
  });
});
