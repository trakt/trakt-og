/**
 * Stands in for `cloudflare:workers` in specs, which have no Worker runtime. A spec sets `env` and reads the promises
 * that `waitUntil` was given.
 */
export const env: { KLIPY_API_KEY?: string; GITHUB_TOKEN?: string } = {};

export const waited: Promise<unknown>[] = [];

export function waitUntil(promise: Promise<unknown>): void {
  waited.push(promise);
}
