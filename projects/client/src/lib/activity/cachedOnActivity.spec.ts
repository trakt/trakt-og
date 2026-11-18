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

  it('should read again instead of showing a saved read its accepts check turns down', async () => {
    await run({ key: () => 'a' });
    read.mockResolvedValue('other');
    const onUpdate = vi.fn();

    expect(await run({ key: () => 'a', accepts: () => false, onUpdate })).toBe('other');
    expect(onUpdate).not.toHaveBeenCalled();
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

  describe('with onUpdate', () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve));

    it('should show the saved read without waiting on last_activities', async () => {
      await run();
      const onUpdate = vi.fn();
      const never = () => new Promise<null>(() => {});

      await expect(run({ activities: never, onUpdate })).resolves.toBe('value');
      expect(read).toHaveBeenCalledTimes(1);
    });

    it('should hand over a fresh read when the key moved', async () => {
      await run();
      read.mockResolvedValue('fresh');
      activities = watchedAt('2026-11-17T11:00:00.000Z');
      const onUpdate = vi.fn();

      await expect(run({ onUpdate })).resolves.toBe('value');
      await settle();

      expect(onUpdate).toHaveBeenCalledWith('fresh');
      await expect(run()).resolves.toBe('fresh');
    });

    it('should stay quiet while the key holds', async () => {
      await run();
      const onUpdate = vi.fn();

      await run({ onUpdate });
      await settle();

      expect(onUpdate).not.toHaveBeenCalled();
      expect(read).toHaveBeenCalledTimes(1);
    });

    it('should wait for the read when nothing usable is saved', async () => {
      await run();
      time += 60_000;
      read.mockResolvedValue('fresh');
      const onUpdate = vi.fn();

      await expect(run({ onUpdate })).resolves.toBe('fresh');
      await settle();
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });
});
