import type { LastActivitiesResponse } from '@trakt/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { activityCacheStorage } from './activityCacheStorage.ts';
import { cachedOnActivity } from './cachedOnActivity.ts';

let activities: LastActivitiesResponse | null = null;
const watchedAt = (at: string) => ({ movies: { watched_at: at } }) as LastActivitiesResponse;

const memory = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
};

describe('cachedOnActivity', () => {
  let local: ReturnType<typeof memory>;
  let read: ReturnType<typeof vi.fn<() => Promise<string>>>;
  let time: number;
  const run = (params: Partial<Parameters<typeof cachedOnActivity<string>>[0]> = {}) =>
    cachedOnActivity({
      name: 'panel',
      activities: () => Promise.resolve(activities),
      user: 'sean',
      key: (latest) => latest.movies?.watched_at,
      read,
      maxAgeMs: 60_000,
      storage: activityCacheStorage(local),
      now: () => time,
      ...params,
    });

  beforeEach(() => {
    local = memory();
    read = vi.fn(() => Promise.resolve('value'));
    time = 0;
    activities = watchedAt('2026-11-17T10:00:00.000Z');
  });

  it('should read once, then reuse the saved read while the key holds', async () => {
    await run();

    expect(await run()).toBe('value');
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('should read again when the key moves', async () => {
    await run();
    activities = watchedAt('2026-11-17T11:00:00.000Z');
    await run();

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('should read again once the saved read is older than maxAgeMs', async () => {
    await run();
    time = 60_000;
    await run();

    expect(read).toHaveBeenCalledTimes(2);
  });

  it("should never reuse another user's read, and drop it when the next user saves", async () => {
    await run({ name: 'other' });
    await run({ user: 'justin' });

    expect(read).toHaveBeenCalledTimes(2);
    expect(activityCacheStorage(local).load('other', 'sean')).toBeNull();
  });

  it('should keep each name apart', async () => {
    await run();
    await run({ name: 'other' });

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('should read again after forget, at sign-out', async () => {
    await run();
    activityCacheStorage(local).forget();
    await run();

    expect(read).toHaveBeenCalledTimes(2);
  });

  it('should read without saving when last_activities fails', async () => {
    activities = null;
    await run();
    await run();

    expect(read).toHaveBeenCalledTimes(2);
    expect(local.getItem('og-activity')).toBeNull();
  });

  it('should still read when storage throws', async () => {
    const blocked = () => {
      throw new Error('blocked');
    };
    const broken = activityCacheStorage({ getItem: blocked, setItem: blocked, removeItem: blocked });

    await expect(run({ storage: broken })).resolves.toBe('value');
    expect(() => broken.forget()).not.toThrow();
  });
});
