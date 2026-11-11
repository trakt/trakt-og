/**
 * Stands in for `cloudflare:workers` in specs, which have no Worker runtime. A spec sets `env` and reads the promises
 * that `waitUntil` was given.
 */
export const env: { KLIPY_API_KEY?: string; GITHUB_TOKEN?: string; WATCHING_NOW_LIVE?: DurableObjectNamespace } = {};

export const waited: Promise<unknown>[] = [];

export function waitUntil(promise: Promise<unknown>): void {
  waited.push(promise);
}

/** Stands in for Cloudflare's Durable Object base class: it keeps the state and env the runtime would hand it. */
export class DurableObject<Env = unknown> {
  protected readonly ctx: DurableObjectState;
  protected readonly env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    this.ctx = ctx;
    this.env = env;
  }
}
