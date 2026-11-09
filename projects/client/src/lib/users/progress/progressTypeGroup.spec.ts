import { describe, expect, it } from 'vitest';
import { progressTypeGroup } from './progressTypeGroup.ts';
import { progressTypes } from './progressTypes.ts';
import { progressTypeGroups } from './progressTypeGroups.ts';

describe('progressTypeGroup', () => {
  it.each([
    ['watched', 'Shows'],
    ['rewatching', 'Shows'],
    ['dropped', 'Shows'],
    ['franchises', 'Movies'],
  ] as const)('should put %s under %s', (type, group) => {
    expect(progressTypeGroup(type)).toBe(group);
  });

  it('should group every tab once', () => {
    expect(progressTypeGroups.flatMap(({ types }) => types).toSorted()).toEqual(Object.keys(progressTypes).toSorted());
  });
});
