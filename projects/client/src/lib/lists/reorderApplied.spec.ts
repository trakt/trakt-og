import { describe, expect, it } from 'vitest';
import { reorderApplied } from './reorderApplied.ts';

describe('util: reorderApplied', () => {
  it('should keep an order the API took every id of, whatever its updated count', () => {
    expect(reorderApplied({ updated: 3, skipped_ids: [] })).toBe(true);
    expect(reorderApplied({ updated: 1, skipped_ids: [], list: { item_count: 3 } })).toBe(true);
  });

  it('should refuse an order with a skipped id', () => {
    expect(reorderApplied({ updated: 2, skipped_ids: [3] })).toBe(false);
  });

  it('should throw on a body off the contract', () => {
    expect(() => reorderApplied({ ok: true })).toThrow();
    expect(() => reorderApplied(null)).toThrow();
  });
});
