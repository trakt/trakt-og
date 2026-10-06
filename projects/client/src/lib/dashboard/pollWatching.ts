type Page = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;

type PollWatchingParams<T> = {
  load: () => Promise<T>;
  onupdate: (value: T) => void;
  page?: Page;
  intervalMs?: number;
};

/**
 * Calls `load` now and every 2 minutes while the page is visible, handing each answer to `onupdate`. A hidden tab
 * stops asking; showing it again asks at once and starts the clock over. Returns the stop function, after which a
 * late answer is dropped. A failed load keeps what was there.
 */
export function pollWatching<T>(
  { load, onupdate, page = document, intervalMs = 120_000 }: PollWatchingParams<T>,
): () => void {
  let timer: ReturnType<typeof setInterval> | undefined;
  let stopped = false;

  const ask = () => {
    load().then((value) => {
      if (!stopped) onupdate(value);
    }).catch(() => {});
  };

  const sync = () => {
    clearInterval(timer);
    timer = undefined;
    if (stopped || page.visibilityState !== 'visible') return;
    ask();
    timer = setInterval(ask, intervalMs);
  };

  page.addEventListener('visibilitychange', sync);
  sync();

  return () => {
    stopped = true;
    clearInterval(timer);
    page.removeEventListener('visibilitychange', sync);
  };
}
