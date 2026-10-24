type VisibleDocument = Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>;

type AfterVisibleForParams = {
  readonly ms: number;
  readonly callback: () => void;
  /** The page's document; a test passes its own. */
  readonly document?: VisibleDocument;
};

/**
 * Runs `callback` once the page has been in view for `ms` in all: time in a background tab doesn't count. Returns a
 * cancel, for a component's teardown.
 */
export function afterVisibleFor({ ms, callback, document = globalThis.document }: AfterVisibleForParams): () => void {
  let left = ms;
  let startedAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const pause = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    left -= Date.now() - startedAt;
  };
  const resume = () => {
    if (timer !== undefined) return;
    startedAt = Date.now();
    timer = setTimeout(
      () => {
        cancel();
        callback();
      },
      Math.max(0, left),
    );
  };
  const change = () => (document.visibilityState === 'visible' ? resume() : pause());
  const cancel = () => {
    pause();
    document.removeEventListener('visibilitychange', change);
  };

  document.addEventListener('visibilitychange', change);
  change();
  return cancel;
}
