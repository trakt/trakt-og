import { describe, expect, it } from 'vitest';
import { toErrorSceneKey } from './toErrorSceneKey.ts';

describe('errors: toErrorSceneKey', () => {
  it.each([
    [400, 'badLink'],
    [404, 'notFound'],
    [500, 'broken'],
    [502, 'upstream'],
    [503, 'maintenance'],
    [504, 'timeout'],
  ] as const)('should map %i to %s', (status, key) => {
    expect(toErrorSceneKey(status)).toBe(key);
  });

  it('should read any other client error as not found', () => {
    expect(toErrorSceneKey(403)).toBe('notFound');
  });

  it('should read any other server error as og breaking', () => {
    expect(toErrorSceneKey(501)).toBe('broken');
  });
});
