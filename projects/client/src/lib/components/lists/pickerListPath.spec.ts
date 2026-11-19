import { describe, expect, it } from 'vitest';
import { pickerListPath } from './pickerListPath.ts';

describe('util: pickerListPath', () => {
  it("should link a list under its owner's profile, so private lists resolve", () => {
    expect(pickerListPath({ id: 123, owner: 'sean' })).toBe('/users/sean/lists/123');
  });

  it("should link a collaboration under the other owner's profile", () => {
    expect(pickerListPath({ id: 9, owner: 'justin.nemeth' })).toBe('/users/justin.nemeth/lists/9');
  });
});
