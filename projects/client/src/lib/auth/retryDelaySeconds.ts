const FIRST_SECONDS = 30;
const MAX_SECONDS = 300;

/** How long a sign-in or sign-out step waits before its next try: 30 seconds, doubling each failure, up to 5 minutes. */
export function retryDelaySeconds(failures: number): number {
  return Math.min(FIRST_SECONDS * 2 ** Math.max(failures - 1, 0), MAX_SECONDS);
}

/** A countdown for the notice: "45s" under a minute, "3:05" from there. */
export function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
