import { describe, expect, it, vi } from 'vitest';
import { createLastActivities } from './createLastActivities.ts';

const T0 = '2026-01-01T00:00:00.000Z';
const stamps = (...fields: string[]) => Object.fromEntries(fields.map((field) => [field, T0]));
const body = {
  all: T0,
  movies: stamps(
    'watched_at',
    'collected_at',
    'rated_at',
    'watchlisted_at',
    'favorited_at',
    'commented_at',
    'paused_at',
    'hidden_at',
  ),
  episodes: stamps('watched_at', 'collected_at', 'rated_at', 'watchlisted_at', 'commented_at', 'paused_at'),
  shows: stamps('rated_at', 'watchlisted_at', 'favorited_at', 'commented_at', 'hidden_at', 'dropped_at'),
  seasons: stamps('rated_at', 'watchlisted_at', 'commented_at', 'hidden_at'),
  comments: stamps('liked_at', 'reacted_at', 'blocked_at'),
  lists: stamps('liked_at', 'reacted_at', 'updated_at', 'commented_at'),
  watchlist: stamps('updated_at'),
  favorites: stamps('updated_at'),
  collaborations: stamps('updated_at'),
  account: stamps('settings_at', 'followed_at', 'following_at', 'pending_at', 'requested_at'),
  saved_filters: stamps('updated_at'),
  notes: stamps('updated_at'),
};

const setup = (respond: () => Response = () => Response.json(body)) => {
  let time = 0;
  const get = vi.fn((_path: string) => Promise.resolve(respond()));
  const reader = createLastActivities({ get, now: () => time });
  return { get, reader, tick: (ms: number) => (time += ms) };
};

describe('createLastActivities', () => {
  it('should share one request between readers on the same page load', async () => {
    const { get, reader } = setup();

    const [first, second] = await Promise.all([reader.read(), reader.read()]);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith('/sync/last_activities');
    expect(first?.movies?.watched_at).toBe(T0);
    expect(second).toBe(first);
  });

  it('should read again once the sharing window has passed', async () => {
    const { get, reader, tick } = setup();

    await reader.read();
    tick(11_000);
    await reader.read();

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('should not share a failed read, so the next one retries', async () => {
    const { get, reader } = setup(() => new Response(null, { status: 502 }));

    expect(await reader.read()).toBeNull();
    await reader.read();

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('should read a body that breaks the contract as a failure', async () => {
    const { reader } = setup(() => Response.json({ all: T0 }));

    expect(await reader.read()).toBeNull();
  });

  it('should read again after forget, for the next user', async () => {
    const { get, reader } = setup();

    await reader.read();
    reader.forget();
    await reader.read();

    expect(get).toHaveBeenCalledTimes(2);
  });
});
