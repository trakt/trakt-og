import type { WatchingNow } from './WatchingNow.ts';

export interface WatchingProgress {
  /** 0 to 100. */
  readonly percent: number;
  /** Watched so far: `m:ss` or `h:mm:ss`, or `h:mm` under reduced motion. */
  readonly elapsed: string;
  /** Time left in the same format, without a sign. `0:00` once it's over. */
  readonly remaining: string;
  /** Over time: "Finished" for a scrobble, "Wrapping up" for a check-in, which is only a runtime estimate. */
  readonly finished: 'Finished' | 'Wrapping up' | null;
  /** Long enough past the end that the bar goes away. */
  readonly gone: boolean;
}

/** How long the finished state stays up before the bar goes away. */
const LINGER = 5 * 60_000;

/**
 * Where `now` falls in `runtime` minutes ending at `endsAt`, like OG's ticker: it started `runtime` before the end.
 * `reducedMotion` drops the seconds, since the bar then only ticks once a minute.
 */
export function watchingProgress(
  { endsAt, runtime, action, now, reducedMotion }: Pick<WatchingNow, 'endsAt' | 'runtime' | 'action'> & {
    now: number;
    reducedMotion: boolean;
  },
): WatchingProgress {
  const end = Date.parse(endsAt);
  const length = runtime * 60_000;
  const watched = Math.min(length, Math.max(0, now - (end - length)));
  const done = now >= end;

  return {
    percent: (watched / length) * 100,
    elapsed: clock(watched, { reducedMotion, round: Math.floor }),
    remaining: clock(length - watched, { reducedMotion, round: Math.ceil }),
    finished: done ? (action === 'checkin' ? 'Wrapping up' : 'Finished') : null,
    gone: now >= end + LINGER,
  };
}

/** Elapsed time rounds down and time left rounds up, so the last minute still reads `0:01`, not `0:00`. */
function clock(ms: number, { reducedMotion, round }: { reducedMotion: boolean; round: (n: number) => number }) {
  if (reducedMotion) {
    const minutes = round(ms / 60_000);
    return `${Math.floor(minutes / 60)}:${pad(minutes % 60)}`;
  }

  const seconds = round(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds % 60)}` : `${minutes}:${pad(seconds % 60)}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
