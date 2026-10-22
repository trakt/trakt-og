import { describe, expect, it } from 'vitest';
import { listItemsPath } from './listItemsPath.ts';

describe('listItemsPath', () => {
  it('should build the items path from the owner and the list id', () => {
    expect(listItemsPath('sean', 42)).toBe('/users/sean/lists/42/items');
  });

  it('should encode the owner and a slug', () => {
    expect(listItemsPath('a b', 'heist & co')).toBe('/users/a%20b/lists/heist%20%26%20co/items');
  });
});
