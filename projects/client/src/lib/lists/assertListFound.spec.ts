import { describe, expect, it } from 'vitest';
import { assertListFound } from './assertListFound.ts';

const check = (summary: { status: number } | null) => () => assertListFound(summary);

describe('assertListFound', () => {
  it('should pass a 200 through', () => {
    expect(check({ status: 200 })).not.toThrow();
  });

  it("should 404 a list that is missing or not the viewer's to see", () => {
    for (const summary of [null, { status: 204 }, { status: 401 }, { status: 403 }, { status: 404 }]) {
      expect(check(summary)).toThrow(expect.objectContaining({ status: 404 }));
    }
  });

  it('should 502 any other failure', () => {
    expect(check({ status: 500 })).toThrow(expect.objectContaining({ status: 502 }));
  });
});
