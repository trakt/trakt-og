import { describe, expect, it } from 'vitest';
import { type ActivityCacheEntry, activityCacheStorage } from './activityCacheStorage.ts';

const memory = (quota = Infinity) => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (value.length > quota) throw new DOMException('Quota exceeded', 'QuotaExceededError');
      items.set(key, value);
    },
    removeItem: (key: string) => void items.delete(key),
  };
};

const entry = (value: unknown, user = 'sean'): ActivityCacheEntry => ({ user, key: 'k', at: 0, value });

describe('activityCacheStorage', () => {
  it('should keep each name apart for one user', () => {
    const storage = activityCacheStorage(memory());
    storage.save('a', entry(1));
    storage.save('b', entry(2));

    expect(storage.load('a', 'sean')?.value).toBe(1);
    expect(storage.load('b', 'sean')?.value).toBe(2);
  });

  it("should drop another user's reads when one saves", () => {
    const storage = activityCacheStorage(memory());
    storage.save('a', entry(1, 'justin'));
    storage.save('b', entry(2));

    expect(storage.load('a', 'justin')).toBeNull();
  });

  it('should not keep a read too large to save, and let its older copy go', () => {
    const storage = activityCacheStorage(memory());
    storage.save('dashboard', entry(1));
    storage.save('calendar', entry('small'));
    storage.save('calendar', entry('x'.repeat(600_000)));

    expect(storage.load('calendar', 'sean')).toBeNull();
    expect(storage.load('dashboard', 'sean')?.value).toBe(1);
  });

  it('should keep the new read alone when the whole set no longer fits', () => {
    const storage = activityCacheStorage(memory(300_000));
    storage.save('calendar', entry('x'.repeat(200_000)));
    storage.save('dashboard', entry('y'.repeat(200_000)));

    expect(storage.load('dashboard', 'sean')?.value).toHaveLength(200_000);
    expect(storage.load('calendar', 'sean')).toBeNull();
  });
});
