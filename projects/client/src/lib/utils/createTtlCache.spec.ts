import { describe, expect, it, vi } from 'vitest';
import { createTtlCache } from './createTtlCache.ts';

describe('util: createTtlCache', () => {
  it('should load once and serve the value until it expires', async () => {
    const get = createTtlCache<string>({ ttlMs: 100, retryMs: 10 });
    const load = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second');

    expect(await get({ now: 0, load })).toBe('first');
    expect(await get({ now: 99, load })).toBe('first');
    expect(await get({ now: 100, load })).toBe('second');
    expect(load).toHaveBeenCalledTimes(2);
  });

  describe('when a reload fails', () => {
    it('should keep serving the last good value until the retry is due', async () => {
      const get = createTtlCache<string>({ ttlMs: 100, retryMs: 10 });
      const load = vi.fn()
        .mockResolvedValueOnce('good')
        .mockRejectedValueOnce(new Error('down'))
        .mockResolvedValueOnce('fresh');

      await get({ now: 0, load });
      expect(await get({ now: 100, load })).toBe('good');
      expect(await get({ now: 109, load })).toBe('good');
      expect(await get({ now: 110, load })).toBe('fresh');
      expect(load).toHaveBeenCalledTimes(3);
    });

    it('should pass the error on when there is nothing to fall back on, and try again next time', async () => {
      const get = createTtlCache<string>({ ttlMs: 100, retryMs: 10 });
      const load = vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce('good');

      await expect(get({ now: 0, load })).rejects.toThrow('down');
      expect(await get({ now: 1, load })).toBe('good');
    });
  });
});
