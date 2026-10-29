import { describe, expect, it } from 'vitest';
import { keepOrder } from './keepOrder.ts';

const items = (...ids: number[]) => ids.map((id) => ({ show: { id } }));
const ids = (list: readonly { show: { id: number } }[]) => list.map(({ show }) => show.id);

describe('keepOrder', () => {
  it('should put the shows back where they were', () => {
    expect(ids(keepOrder(items(3, 1, 2), [1, 2, 3]))).toEqual([1, 2, 3]);
  });

  it('should add new shows after the rest, in their own order', () => {
    expect(ids(keepOrder(items(5, 2, 4, 1), [1, 2]))).toEqual([1, 2, 5, 4]);
  });

  it('should leave out shows that are gone', () => {
    expect(ids(keepOrder(items(2), [1, 2, 3]))).toEqual([2]);
  });
});
