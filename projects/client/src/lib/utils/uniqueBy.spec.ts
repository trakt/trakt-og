import { describe, expect, it } from 'vitest';
import { uniqueBy } from './uniqueBy.ts';

describe('util: uniqueBy', () => {
  it('should keep the first item for each key in order', () => {
    const items = [{ id: 2, n: 'a' }, { id: 1, n: 'b' }, { id: 2, n: 'c' }, { id: 3, n: 'd' }, { id: 1, n: 'e' }];
    expect(uniqueBy(items, ({ id }) => id).map(({ n }) => n)).toEqual(['a', 'b', 'd']);
  });

  it('should match a findIndex filter on a large random list', () => {
    const items = Array.from({ length: 2000 }, (_, i) => ({ key: (i * 7919) % 613, i }));
    const slow = items.filter((item, i) => items.findIndex(({ key }) => key === item.key) === i);
    expect(uniqueBy(items, ({ key }) => key)).toEqual(slow);
  });
});
