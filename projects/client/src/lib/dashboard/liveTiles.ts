import type { LiveWatch } from './fetchWatching.ts';

/** Someone the viewer follows watching now, with how far in they are. */
export type LiveTile = {
  readonly watch: LiveWatch;
  /** How far in, 0 to 100. */
  readonly progress: number;
  readonly minutesLeft: number;
};

/** Who's watching now, newest start first. A watch past its `expires_at` is dropped. */
export function liveTiles(live: readonly LiveWatch[], now: Date): readonly LiveTile[] {
  const at = now.getTime();

  return live
    .filter(({ expiresAt }) => Date.parse(expiresAt) > at)
    .toSorted((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    .map((watch) => {
      const started = Date.parse(watch.startedAt);
      const expires = Date.parse(watch.expiresAt);
      const share = expires > started ? (at - started) / (expires - started) : 1;
      return {
        watch,
        progress: Math.round(Math.min(Math.max(share, 0), 1) * 100),
        minutesLeft: Math.max(1, Math.round((expires - at) / 60_000)),
      };
    });
}
