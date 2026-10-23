import { describe, expect, it, vi } from 'vitest';
import { lazy } from './lazy.ts';

describe('lazy', () => {
  it('should not start until something calls then', () => {
    const start = vi.fn(() => Promise.resolve(1));

    lazy(start);

    expect(start).not.toHaveBeenCalled();
  });

  it('should start once however many times it is awaited', async () => {
    const start = vi.fn(() => Promise.resolve(7));
    const value = lazy(start);

    expect(await value).toBe(7);
    expect(await value).toBe(7);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('should start on a direct then call, and share that run with an await', async () => {
    const start = vi.fn(() => Promise.resolve(3));
    const value = lazy(start);

    expect(await value.then((n) => n + 1)).toBe(4);
    expect(await value).toBe(3);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('should pass a rejection on to each caller', async () => {
    const value = lazy(() => Promise.reject(new Error('nope')));

    await expect(Promise.resolve(value)).rejects.toThrow('nope');
  });
});
