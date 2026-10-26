import type { z } from 'zod/v4';
import { readWatchNow } from './readWatchNow.ts';

/** One watch-now read's body, or `null` for any failure, which the modal shows as no offers. */
export async function fetchWatchNow<T extends z.ZodType>(
  params: Parameters<typeof readWatchNow<T>>[0],
): Promise<z.output<T> | null> {
  return (await readWatchNow(params)).data;
}
