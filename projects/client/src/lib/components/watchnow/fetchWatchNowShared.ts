import type { z } from 'zod/v4';
import { fetchWatchNow } from './fetchWatchNow.ts';

const shared = new Map<string, Promise<unknown>>();

/** Item-independent reads shared by every dialog: one request per path, and a failed read is retried next time. */
export function fetchWatchNowShared<T extends z.ZodType>(
  params: Parameters<typeof fetchWatchNow<T>>[0],
): Promise<z.output<T> | null> {
  const cached = shared.get(params.path) as Promise<z.output<T> | null> | undefined;
  if (cached) return cached;

  const pending = fetchWatchNow(params).then((result) => {
    if (result === null) shared.delete(params.path);
    return result;
  });
  shared.set(params.path, pending);
  return pending;
}
