import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRecentReads } from './recentReads.ts';

describe('createRecentReads', () => {
  let time: number;
  let reads: ReturnType<typeof createRecentReads>;
  const start = vi.fn(() => Promise.resolve('value'));

  beforeEach(() => {
    time = 0;
    start.mockClear();
    reads = createRecentReads({ ttlMs: 1000, max: 2, now: () => time });
  });

  it('should read once and hand back the same read within the window', async () => {
    const first = reads.read('a', start);
    const second = reads.read('a', start);

    expect(second).toBe(first);
    await expect(second).resolves.toBe('value');
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('should read again once the window has passed', () => {
    reads.read('a', start);
    time += 1000;
    reads.read('a', start);

    expect(start).toHaveBeenCalledTimes(2);
  });

  it('should drop a failed read, so the next one tries again', async () => {
    const failing = reads.read('a', () => Promise.reject(new Error('down')));
    await expect(failing).rejects.toThrow();
    reads.read('a', start);

    expect(start).toHaveBeenCalledTimes(1);
  });

  it('should keep only the newest reads past max', () => {
    reads.read('a', start);
    reads.read('b', start);
    reads.read('c', start);
    reads.read('a', start);

    expect(start).toHaveBeenCalledTimes(4);
  });

  it('should forget everything', () => {
    reads.read('a', start);
    reads.forget();
    reads.read('a', start);

    expect(start).toHaveBeenCalledTimes(2);
  });
});
