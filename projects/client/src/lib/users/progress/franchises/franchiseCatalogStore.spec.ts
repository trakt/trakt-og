import { describe, expect, it } from 'vitest';
import type { Franchise } from './Franchise.ts';
import { franchiseCatalogStore } from './franchiseCatalogStore.ts';

const franchises: readonly Franchise[] = [{ id: 1, slug: 'a-collection', name: 'A', movieIds: [1, 2], likeCount: 4 }];
const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
};
const HOUR = 60 * 60_000;

describe('franchiseCatalogStore', () => {
  it('should give back what it kept within a day', () => {
    const storage = memory();
    franchiseCatalogStore({ storage, now: () => 0 }).write(franchises);

    expect(franchiseCatalogStore({ storage, now: () => 23 * HOUR }).read()).toEqual(franchises);
  });

  it('should drop a copy a day old', () => {
    const storage = memory();
    franchiseCatalogStore({ storage, now: () => 0 }).write(franchises);

    expect(franchiseCatalogStore({ storage, now: () => 24 * HOUR }).read()).toBeNull();
  });

  it('should read nothing from a copy it cannot parse', () => {
    const storage = { getItem: () => '{"at":"yesterday"}', setItem: () => undefined };

    expect(franchiseCatalogStore({ storage }).read()).toBeNull();
  });

  it('should carry on when storage throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    const store = franchiseCatalogStore({ storage });

    expect(() => store.write(franchises)).not.toThrow();
    expect(store.read()).toBeNull();
  });
});
