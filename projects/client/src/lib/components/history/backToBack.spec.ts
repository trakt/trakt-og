import { describe, expect, it } from 'vitest';
import { backToBack } from './backToBack.ts';

describe('backToBack', () => {
  it('should end at the given time and step back by the runtime', () => {
    expect(backToBack({ count: 3, end: '2026-10-29T21:34:00.000Z', runtime: 22 })).toEqual([
      '2026-10-29T20:50:00.000Z',
      '2026-10-29T21:12:00.000Z',
      '2026-10-29T21:34:00.000Z',
    ]);
  });
  it('should give every episode the same time without a runtime', () => {
    expect(backToBack({ count: 2, end: '2026-10-29T21:34:00.000Z' })).toEqual([
      '2026-10-29T21:34:00.000Z',
      '2026-10-29T21:34:00.000Z',
    ]);
  });
});
