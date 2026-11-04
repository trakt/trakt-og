import { describe, expect, it } from 'vitest';
import { sha256 } from './sha256.ts';

describe('util: sha256', () => {
  it('should hash to lowercase hex', async () => {
    expect(await sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
